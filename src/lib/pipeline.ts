import { createHash } from "node:crypto";
import { Prisma, type InboundMessage } from "@prisma/client";
import { audit } from "./audit";
import { fromISODate } from "./business-days";
import { orderCode, prisma } from "./db";
import { createExtractionProvider, type ExtractionProvider } from "./extraction";
import { normalize } from "./extraction/rules";
import { brl } from "./format";
import { createNotifier, type Notifier } from "./notify";
import { extractPdfText } from "./pdf";
import { TransientError, withRetry } from "./retry";
import {
  approvalsSchema,
  correctionSchema,
  draftSchema,
  EXCEPTION_LABELS,
  inboundSchema,
  type Approvals,
  type CustomerSnapshot,
  type ExceptionCode,
  type ExtractedDraft,
  type ProductSnapshot,
} from "./types";
import { validateDraft, type ValidationResult } from "./validation";

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
/** Disputa de estoque/crédito detectada dentro da transação de registro (RN-11). */
class RaceError extends Error {}

export interface PipelineDeps {
  extraction: ExtractionProvider;
  notifier: Notifier;
  now: () => Date;
  retry: { attempts: number; baseDelayMs: number; sleep?: (ms: number) => Promise<void> };
  /** Gancho de teste: permite injetar falhas em uma etapa/tentativa. */
  fault?: (stage: "extract" | "persist", attempt: number) => void;
}

export function defaultDeps(): PipelineDeps {
  return {
    extraction: createExtractionProvider(),
    notifier: createNotifier(),
    now: () => new Date(),
    retry: { attempts: 3, baseDelayMs: 200 },
  };
}

export type IngestStatus = "registered" | "exception" | "duplicate" | "failed";

export interface IngestResult {
  status: IngestStatus;
  messageId: string;
  orderId?: string;
  orderCode?: string;
  reasons?: ExceptionCode[];
  detail?: string;
}

const EMPTY_DRAFT: ExtractedDraft = {
  customerCnpj: null,
  items: [],
  deadline: null,
  deadlineText: null,
  confidence: 0,
  format: "text",
  notes: [],
};

export function canonicalCnpj(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length !== 14) return raw.trim();
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function hashContent(p: { from: string; subject: string; body: string; attachment?: { contentBase64: string } }): string {
  const h = createHash("sha256");
  h.update(`${p.from.toLowerCase()}|${normalize(p.subject)}|${normalize(p.body)}|${p.attachment?.contentBase64 ?? ""}`);
  return h.digest("hex");
}

/* ------------------------------------------------------------------ entrada */

export async function ingestMessage(raw: unknown, deps: PipelineDeps = defaultDeps()): Promise<IngestResult> {
  const payload = inboundSchema.parse(raw);
  const receivedAt = payload.receivedAt ? new Date(payload.receivedAt) : deps.now();
  const contentHash = hashContent(payload);
  const messageId = payload.messageId ?? `sha256:${contentHash}`;

  // Segunda camada de RN-10: mesmo conteúdo, do mesmo remetente, nas últimas 24 h.
  const sameContent = await prisma.inboundMessage.findFirst({
    where: { contentHash, createdAt: { gte: new Date(deps.now().getTime() - 24 * 3_600_000) } },
    include: { order: true },
  });
  if (sameContent) return duplicateResult(sameContent, "mesmo conteúdo recebido nas últimas 24 h");

  let message: InboundMessage;
  try {
    message = await prisma.inboundMessage.create({
      data: {
        messageId,
        contentHash,
        fromEmail: payload.from.toLowerCase(),
        subject: payload.subject,
        body: payload.body,
        attachmentName: payload.attachment?.filename,
        attachmentBase64: payload.attachment?.contentBase64,
        receivedAt,
      },
    });
  } catch (err) {
    // A restrição UNIQUE do banco é quem garante RN-10 sob concorrência (ADR-003).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.inboundMessage.findUnique({ where: { messageId }, include: { order: true } });
      if (existing) return duplicateResult(existing, "mesmo identificador de mensagem");
    }
    throw err;
  }

  await audit(prisma, {
    type: "MESSAGE_RECEIVED",
    message: `Mensagem recebida de ${message.fromEmail}: "${message.subject}".`,
    inboundMessageId: message.id,
    data: { messageId, hasAttachment: Boolean(payload.attachment) },
  });

  return processMessage(message.id, deps);
}

async function duplicateResult(
  existing: InboundMessage & { order: { id: string; number: number } | null },
  why: string,
): Promise<IngestResult> {
  await prisma.inboundMessage.update({ where: { id: existing.id }, data: { duplicateCount: { increment: 1 } } });
  await audit(prisma, {
    type: "DUPLICATE_IGNORED",
    message: `Reenvio ignorado (${why}). Nenhum pedido novo foi criado.`,
    inboundMessageId: existing.id,
    orderId: existing.order?.id,
  });
  return {
    status: "duplicate",
    messageId: existing.messageId,
    orderId: existing.order?.id,
    orderCode: existing.order ? orderCode(existing.order.number) : undefined,
    detail: why,
  };
}

/* ------------------------------------------------------------ processamento */

async function processMessage(id: string, deps: PipelineDeps): Promise<IngestResult> {
  const message = await prisma.inboundMessage.findUniqueOrThrow({ where: { id } });
  try {
    return await withRetry(
      async (attempt) => {
        await prisma.inboundMessage.update({ where: { id }, data: { attempts: attempt } });
        deps.fault?.("extract", attempt);
        const draft = await extractDraft(message, deps);
        deps.fault?.("persist", attempt);
        return evaluateAndPersist({ message, draft, approvals: {}, existing: null, actor: null, deps });
      },
      {
        ...deps.retry,
        onRetry: async (attempt, err, delay) => {
          await audit(prisma, {
            type: "RETRY_SCHEDULED",
            message: `Falha transitória na tentativa ${attempt}; nova tentativa em ${delay} ms.`,
            inboundMessageId: id,
            data: { error: err instanceof Error ? err.message : String(err) },
          });
        },
      },
    );
  } catch (err) {
    return markFailed(message, err, deps);
  }
}

async function extractDraft(message: InboundMessage, deps: PipelineDeps): Promise<ExtractedDraft> {
  const products = await prisma.product.findMany({ where: { active: true } });
  const attachmentText = message.attachmentBase64
    ? extractPdfText(Buffer.from(message.attachmentBase64, "base64"))
    : undefined;
  const draft = await deps.extraction.extract({
    messageId: message.messageId,
    fromEmail: message.fromEmail,
    subject: message.subject,
    body: message.body,
    attachmentText,
    receivedAt: message.receivedAt,
    catalog: products.map((p) => ({ sku: p.sku, name: p.name, aliases: p.aliases })),
  });
  const parsed = draftSchema.parse({ ...draft, customerCnpj: canonicalCnpj(draft.customerCnpj) });
  await audit(prisma, {
    type: "EXTRACTED",
    message: `Extração (${deps.extraction.name}): ${parsed.items.length} item(ns), confiança ${parsed.confidence.toFixed(2)}, formato ${parsed.format}.`,
    inboundMessageId: message.id,
    data: { provider: deps.extraction.name, confidence: parsed.confidence, items: parsed.items.length, notes: parsed.notes },
  });
  return parsed;
}

interface EvalArgs {
  message: InboundMessage;
  draft: ExtractedDraft;
  approvals: Approvals;
  existing: { orderId: string; reviewed: boolean; hadException: boolean } | null;
  actor: string | null;
  deps: PipelineDeps;
}

const num = (d: Prisma.Decimal | number) => Number(d.toString());

async function loadContext(draft: ExtractedDraft, senderEmail: string) {
  const cnpj = canonicalCnpj(draft.customerCnpj);
  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ where: { OR: [...(cnpj ? [{ cnpj }] : []), { email: senderEmail }] } }),
    prisma.product.findMany({ where: { sku: { in: draft.items.map((i) => i.sku ?? "").filter(Boolean) } } }),
  ]);
  return {
    customers: customers.map<CustomerSnapshot>((c) => ({
      id: c.id,
      cnpj: c.cnpj,
      name: c.name,
      email: c.email,
      creditLimit: num(c.creditLimit),
      creditUsed: num(c.creditUsed),
      active: c.active,
    })),
    products: products.map<ProductSnapshot>((p) => ({
      sku: p.sku,
      name: p.name,
      aliases: p.aliases,
      price: num(p.price),
      stock: p.stock,
      active: p.active,
    })),
  };
}

async function evaluateAndPersist(a: EvalArgs): Promise<IngestResult> {
  for (let round = 1; round <= 3; round++) {
    const ctx = await loadContext(a.draft, a.message.fromEmail);
    const result = validateDraft({
      draft: a.draft,
      senderEmail: a.message.fromEmail,
      customers: ctx.customers,
      products: ctx.products,
      receivedAt: a.message.receivedAt,
      approvals: a.approvals,
    });

    if (round === 1 && result.deadlineAssumed) {
      await audit(prisma, {
        type: "DEADLINE_ASSUMED",
        message: `Cliente não informou prazo; assumi ${result.deadline} (2 dias úteis, RN-08).`,
        inboundMessageId: a.message.id,
        orderId: a.existing?.orderId,
      });
    }
    await audit(prisma, {
      type: "VALIDATED",
      message: result.ok
        ? "Validação concluída sem pendências."
        : `Validação encontrou ${result.issues.length} pendência(s): ${result.issues.map((i) => EXCEPTION_LABELS[i.code]).join("; ")}.`,
      inboundMessageId: a.message.id,
      orderId: a.existing?.orderId,
      data: { issues: result.issues.map((i) => ({ code: i.code, detail: i.detail })), waived: result.waived },
    });

    if (!result.ok) return openOrUpdateException(a, result);

    try {
      return await registerOrder(a, result);
    } catch (err) {
      if (!(err instanceof RaceError)) throw err;
      await audit(prisma, {
        type: "RACE_DETECTED",
        message: "Estoque ou crédito mudou durante o registro; revalidando.",
        inboundMessageId: a.message.id,
        data: { round },
      });
    }
  }
  throw new TransientError("Disputa persistente de estoque/crédito");
}

/* ---------------------------------------------------------------- registro */

async function registerOrder(a: EvalArgs, r: ValidationResult): Promise<IngestResult> {
  const { message, deps } = a;
  const customer = r.customer!;
  const now = deps.now();

  const qtyBySku = new Map<string, number>();
  for (const i of r.items) qtyBySku.set(i.sku!, (qtyBySku.get(i.sku!) ?? 0) + i.quantity!);
  const creditWaived = r.waived.some((w) => w.code === "CREDIT_LIMIT_EXCEEDED");

  const order = await prisma.$transaction(async (tx) => {
    // RN-11: reserva de estoque e consumo de crédito na mesma transação do registro.
    for (const [sku, qty] of qtyBySku) {
      const res = await tx.product.updateMany({ where: { sku, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (res.count === 0) throw new RaceError(`estoque de ${sku}`);
    }
    const rows = await tx.$executeRaw`
      UPDATE "Customer" SET "creditUsed" = "creditUsed" + ${r.total}
      WHERE id = ${customer.id} AND ("creditUsed" + ${r.total} <= "creditLimit" OR ${creditWaived})`;
    if (rows === 0) throw new RaceError("crédito do cliente");

    const prior = await tx.order.findUnique({ where: { messageId: message.id } });
    const data = {
      customerId: customer.id,
      status: "REGISTERED" as const,
      deadline: r.deadline ? fromISODate(r.deadline) : null,
      deadlineAssumed: r.deadlineAssumed,
      total: r.total,
      confidence: a.draft.confidence,
      provider: deps.extraction.name,
      registeredAt: now,
      reviewed: Boolean(prior?.reviewed || prior?.status === "EXCEPTION"),
      draft: a.draft as unknown as Prisma.InputJsonValue,
      approvals: a.approvals as unknown as Prisma.InputJsonValue,
    };
    const saved = prior
      ? await tx.order.update({ where: { id: prior.id }, data })
      : await tx.order.create({ data: { ...data, messageId: message.id, receivedAt: message.receivedAt } });

    await tx.orderItem.deleteMany({ where: { orderId: saved.id } });
    await tx.orderItem.createMany({
      data: r.items.map((i) => ({
        orderId: saved.id,
        sku: i.sku,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
    });
    await tx.inboundMessage.update({ where: { id: message.id }, data: { status: "PROCESSED", lastError: null } });

    if (a.existing?.hadException) {
      await tx.exceptionCase.update({
        where: { orderId: saved.id },
        data: { status: "RESOLVED", resolvedAt: now, resolution: `Corrigido por ${a.actor ?? "operador"} e reprocessado.` },
      });
      await audit(tx, {
        type: "EXCEPTION_RESOLVED",
        message: `Exceção resolvida por ${a.actor ?? "operador"}; pedido revalidado com sucesso.`,
        actor: "USER",
        actorName: a.actor ?? "operador",
        orderId: saved.id,
      });
    }
    await audit(tx, {
      type: "ORDER_REGISTERED",
      message: `Pedido ${orderCode(saved.number)} registrado: ${r.items.length} item(ns), total ${brl(r.total)}; estoque reservado e crédito atualizado.`,
      orderId: saved.id,
      inboundMessageId: message.id,
      data: { total: r.total, waived: r.waived },
    });
    return saved;
  });

  await notify(deps, order.id, {
    channel: "equipe-comercial",
    recipient: "#pedidos",
    subject: `Pedido ${orderCode(order.number)} registrado`,
    body: `${customer.name} · ${r.items.length} item(ns) · ${brl(r.total)} · prazo ${r.deadline?.split("-").reverse().join("/")}`,
  });

  return { status: "registered", messageId: message.messageId, orderId: order.id, orderCode: orderCode(order.number) };
}

/* ------------------------------------------------------------------ exceção */

async function openOrUpdateException(a: EvalArgs, r: ValidationResult): Promise<IngestResult> {
  const { message, deps } = a;
  const deadlineValid = r.deadline && !Number.isNaN(fromISODate(r.deadline).getTime());

  const { order, created } = await prisma.$transaction(async (tx) => {
    const prior = await tx.order.findUnique({ where: { messageId: message.id }, include: { exception: true } });
    const data = {
      customerId: r.customer?.id ?? null,
      status: "EXCEPTION" as const,
      deadline: deadlineValid ? fromISODate(r.deadline!) : null,
      deadlineAssumed: r.deadlineAssumed,
      total: r.total,
      confidence: a.draft.confidence,
      provider: deps.extraction.name,
      reviewed: true,
      draft: a.draft as unknown as Prisma.InputJsonValue,
      approvals: a.approvals as unknown as Prisma.InputJsonValue,
    };
    const saved = prior
      ? await tx.order.update({ where: { id: prior.id }, data })
      : await tx.order.create({ data: { ...data, messageId: message.id, receivedAt: message.receivedAt } });

    await tx.orderItem.deleteMany({ where: { orderId: saved.id } });
    await tx.orderItem.createMany({
      data: r.items.map((i) => ({
        orderId: saved.id,
        sku: i.sku,
        description: i.description,
        quantity: i.quantity === null ? null : Math.trunc(i.quantity),
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
    });

    const issues = r.issues as unknown as Prisma.InputJsonValue;
    const isNew = !prior?.exception;
    if (prior?.exception) {
      await tx.exceptionCase.update({
        where: { orderId: saved.id },
        data: { status: "OPEN", primary: r.primary!, issues, resolvedAt: null, resolution: null },
      });
    } else {
      await tx.exceptionCase.create({ data: { orderId: saved.id, primary: r.primary!, issues } });
    }
    await tx.inboundMessage.update({ where: { id: message.id }, data: { status: "PROCESSED" } });
    await audit(tx, {
      type: isNew ? "EXCEPTION_OPENED" : "EXCEPTION_UPDATED",
      message: `${isNew ? "Enviei para a fila de exceções" : "Pedido segue na fila"}: ${r.issues.map((i) => EXCEPTION_LABELS[i.code]).join("; ")}.`,
      orderId: saved.id,
      inboundMessageId: message.id,
      data: { issues: r.issues.map((i) => ({ code: i.code, detail: i.detail, sku: i.sku ?? null })) },
    });
    return { order: saved, created: isNew };
  });

  if (created) {
    await notify(deps, order.id, {
      channel: "equipe-comercial",
      recipient: "#fila-de-excecoes",
      subject: `Pedido ${orderCode(order.number)} em exceção`,
      body: `${r.customer?.name ?? message.fromEmail}: ${r.issues.map((i) => EXCEPTION_LABELS[i.code]).join("; ")}`,
    });
  }

  return {
    status: "exception",
    messageId: message.messageId,
    orderId: order.id,
    orderCode: orderCode(order.number),
    reasons: r.issues.map((i) => i.code),
  };
}

async function markFailed(message: InboundMessage, err: unknown, deps: PipelineDeps): Promise<IngestResult> {
  const error = err instanceof Error ? err.message : String(err);
  const issues = [{ code: "PROCESSING_FAILED", detail: `Não consegui processar a mensagem: ${error}` }];
  const order = await prisma.$transaction(async (tx) => {
    await tx.inboundMessage.update({ where: { id: message.id }, data: { status: "FAILED", lastError: error } });
    const prior = await tx.order.findUnique({ where: { messageId: message.id }, include: { exception: true } });
    const saved =
      prior ??
      (await tx.order.create({
        data: {
          messageId: message.id,
          status: "EXCEPTION",
          total: 0,
          confidence: 0,
          provider: deps.extraction.name,
          receivedAt: message.receivedAt,
          reviewed: true,
          draft: EMPTY_DRAFT as unknown as Prisma.InputJsonValue,
        },
      }));
    if (prior?.exception) {
      await tx.exceptionCase.update({ where: { orderId: saved.id }, data: { status: "OPEN", primary: "PROCESSING_FAILED", issues } });
    } else {
      await tx.exceptionCase.create({ data: { orderId: saved.id, primary: "PROCESSING_FAILED", issues } });
    }
    await audit(tx, {
      type: "PROCESSING_FAILED",
      message: `Processamento falhou após as tentativas: ${error}`,
      orderId: saved.id,
      inboundMessageId: message.id,
    });
    return saved;
  });
  await notify(deps, order.id, {
    channel: "equipe-comercial",
    recipient: "#fila-de-excecoes",
    subject: `Pedido ${orderCode(order.number)} com falha de processamento`,
    body: `${message.fromEmail}: ${error}`,
  });
  return {
    status: "failed",
    messageId: message.messageId,
    orderId: order.id,
    orderCode: orderCode(order.number),
    reasons: ["PROCESSING_FAILED"],
    detail: error,
  };
}

async function notify(
  deps: PipelineDeps,
  orderId: string,
  msg: { channel: string; recipient: string; subject: string; body: string },
) {
  try {
    await deps.notifier.send({ ...msg, orderId });
    await audit(prisma, { type: "NOTIFIED", message: `Equipe notificada (${deps.notifier.name}): ${msg.subject}.`, orderId });
  } catch (err) {
    // Falha de notificação não derruba o pedido já registrado; fica na trilha.
    await audit(prisma, {
      type: "NOTIFY_FAILED",
      message: `Não consegui notificar a equipe: ${err instanceof Error ? err.message : String(err)}`,
      orderId,
    });
  }
}

/* ------------------------------------------------- correção e reprocessamento */

export async function reprocessOrder(
  orderId: string,
  rawCorrection: unknown,
  deps: PipelineDeps = defaultDeps(),
): Promise<IngestResult> {
  const c = correctionSchema.parse(rawCorrection ?? {});
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { message: true, exception: true } });
  if (!order) throw new NotFoundError("Pedido não encontrado");
  if (order.status === "REGISTERED") throw new ConflictError("Pedido já registrado; não há o que reprocessar.");

  let draft = draftSchema.parse(order.draft);
  const before = { customerCnpj: draft.customerCnpj, items: draft.items.map((i) => ({ sku: i.sku, quantity: i.quantity })), deadline: draft.deadline };

  if (c.reextract) draft = await extractDraft(order.message, deps);

  const touched = c.customerCnpj !== undefined || c.items !== undefined || c.deadline !== undefined;
  if (c.customerCnpj !== undefined) draft.customerCnpj = canonicalCnpj(c.customerCnpj);
  if (c.items) {
    draft.items = c.items.map((i) => ({ sku: i.sku.trim().toUpperCase(), description: i.sku.trim().toUpperCase(), quantity: i.quantity, raw: "corrigido na fila" }));
  }
  if (c.deadline !== undefined) {
    draft.deadline = c.deadline || null;
    draft.deadlineText = null;
  }
  if (touched) {
    // Revisão humana substitui o julgamento de confiança da extração.
    draft.confidence = 1;
    draft.notes = [...draft.notes, `Revisado por ${c.actor}.`];
    await audit(prisma, {
      type: "CORRECTION_APPLIED",
      message: `${c.actor} corrigiu o rascunho do pedido.`,
      actor: "USER",
      actorName: c.actor,
      orderId,
      data: {
        before,
        after: { customerCnpj: draft.customerCnpj, items: draft.items.map((i) => ({ sku: i.sku, quantity: i.quantity })), deadline: draft.deadline },
      },
    });
  }

  const approvals = approvalsSchema.parse(order.approvals ?? {});
  const at = deps.now().toISOString();
  for (const [key, reason] of Object.entries(c.approvals ?? {}) as ["credit" | "highValue", string][]) {
    if (!reason) continue;
    approvals[key] = { reason, by: c.actor, at };
    await audit(prisma, {
      type: "APPROVAL_GRANTED",
      message: `${c.actor} aprovou exceção de ${key === "credit" ? "crédito" : "valor alto"}: "${reason}".`,
      actor: "USER",
      actorName: c.actor,
      orderId,
    });
  }

  if (!touched && !c.reextract && !c.approvals) {
    await audit(prisma, { type: "CORRECTION_APPLIED", message: `${c.actor} pediu reprocessamento sem alterar dados.`, actor: "USER", actorName: c.actor, orderId });
  }

  return evaluateAndPersist({
    message: order.message,
    draft,
    approvals,
    existing: { orderId, reviewed: order.reviewed, hadException: Boolean(order.exception) },
    actor: c.actor,
    deps,
  });
}
