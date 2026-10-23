import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { FixtureExtractionProvider, RulesExtractionProvider } from "@/lib/extraction";
import { createSimplePdf } from "@/lib/pdf";
import { ingestMessage, reprocessOrder, type PipelineDeps } from "@/lib/pipeline";
import { SimulatedNotifier, type Notifier } from "@/lib/notify";
import { TransientError } from "@/lib/retry";
import { LOW_STOCK_SKU, SEED_CUSTOMERS, seedDatabase } from "@/lib/seed-data";
import { prisma } from "@/lib/db";

const pinheiro = SEED_CUSTOMERS[0];
const mercado = SEED_CUSTOMERS[3];

const deps = (over: Partial<PipelineDeps> = {}): PipelineDeps => ({
  extraction: new RulesExtractionProvider(),
  notifier: new SimulatedNotifier(),
  now: () => new Date(),
  retry: { attempts: 3, baseDelayMs: 1, sleep: async () => {} },
  ...over,
});

const mail = (n: number, body: string, from = pinheiro.email, extra: object = {}) => ({
  messageId: `<it-${n}@test.example>`,
  from,
  subject: `Pedido ${n}`,
  body,
  ...extra,
});

const table = (rows: string) => `| SKU | Descrição | Qtd |\n|---|---|---|\n${rows}`;

beforeEach(async () => {
  await seedDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("pipeline: fluxos de ponta a ponta (HU-01 a HU-06)", () => {
  it("pedido bem formatado é registrado, reserva estoque, consome crédito e notifica (HU-01)", async () => {
    const r = await ingestMessage(mail(1, table("| DJM-020 | Disjuntor | 10 |\n| TOM-010 | Tomada | 5 |")), deps());
    expect(r.status).toBe("registered");

    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
    expect(order.status).toBe("REGISTERED");
    expect(Number(order.total)).toBe(198.5); // 10*14,90 + 5*9,90
    expect(order.items).toHaveLength(2);
    expect(order.registeredAt).not.toBeNull();
    expect(order.reviewed).toBe(false);

    const product = await prisma.product.findUniqueOrThrow({ where: { sku: "DJM-020" } });
    expect(product.stock).toBe(20000 - 10);
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: order.customerId! } });
    expect(Number(customer.creditUsed)).toBe(14000 + 198.5);

    expect(await prisma.notification.count({ where: { orderId: order.id } })).toBe(1);
    const types = (await prisma.auditEvent.findMany({ where: { OR: [{ orderId: order.id }, { inboundMessageId: order.messageId }] }, orderBy: { at: "asc" } })).map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(["MESSAGE_RECEIVED", "EXTRACTED", "VALIDATED", "ORDER_REGISTERED", "NOTIFIED"]));
  });

  it("texto livre é extraído e registrado, com prazo assumido registrado na auditoria (HU-02, RN-08)", async () => {
    const r = await ingestMessage(mail(2, "Bom dia,\npreciso de 20 disjuntor 20A, 5 rolos de cabo 2,5mm e 10 tomadas 20A.\nObrigado"), deps());
    expect(r.status).toBe("registered");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
    expect(order.items.map((i) => [i.sku, i.quantity])).toEqual(expect.arrayContaining([["DJM-020", 20], ["CAB-025", 5], ["TOM-020", 10]]));
    expect(order.deadlineAssumed).toBe(true);
    expect(await prisma.auditEvent.count({ where: { type: "DEADLINE_ASSUMED" } })).toBe(1);
  });

  it("PDF simples em anexo é processado", async () => {
    const pdf = createSimplePdf(["PEDIDO DE COMPRA No 3", `CNPJ: ${pinheiro.cnpj}`, "INT-001 | Interruptor simples | 12"]);
    const r = await ingestMessage(mail(3, "segue em anexo", pinheiro.email, { attachment: { filename: "p.pdf", contentBase64: pdf.toString("base64") } }), deps());
    expect(r.status).toBe("registered");
  });

  it("item inexistente vai para a fila de exceções com o motivo e não consome estoque nem crédito (HU-05)", async () => {
    const r = await ingestMessage(mail(4, table("| XYZ-123 | Coisa | 3 |\n| DJM-020 | Disjuntor | 4 |")), deps());
    expect(r).toMatchObject({ status: "exception", reasons: ["UNKNOWN_SKU"] });
    const ex = await prisma.exceptionCase.findUniqueOrThrow({ where: { orderId: r.orderId } });
    expect(ex.status).toBe("OPEN");
    expect(ex.primary).toBe("UNKNOWN_SKU");
    expect((await prisma.product.findUniqueOrThrow({ where: { sku: "DJM-020" } })).stock).toBe(20000);
    expect(Number((await prisma.customer.findUniqueOrThrow({ where: { cnpj: pinheiro.cnpj } })).creditUsed)).toBe(14000);
  });

  it("o mesmo e-mail duas vezes não gera dois pedidos (HU-04, RN-10)", async () => {
    const m = mail(5, table("| DJM-020 | Disjuntor | 10 |"));
    const first = await ingestMessage(m, deps());
    const second = await ingestMessage(m, deps());
    expect(first.status).toBe("registered");
    expect(second).toMatchObject({ status: "duplicate", orderId: first.orderId });
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { sku: "DJM-020" } })).stock).toBe(20000 - 10);
    expect((await prisma.inboundMessage.findFirstOrThrow()).duplicateCount).toBe(1);
    expect(await prisma.auditEvent.count({ where: { type: "DUPLICATE_IGNORED" } })).toBe(1);
  });

  it("reenvio com outro Message-ID mas mesmo conteúdo também é ignorado", async () => {
    const body = table("| DJM-020 | Disjuntor | 10 |");
    await ingestMessage(mail(6, body), deps());
    const again = await ingestMessage({ ...mail(6, body), messageId: "<outro-id@test.example>" }, deps());
    expect(again.status).toBe("duplicate");
    expect(await prisma.order.count()).toBe(1);
  });

  it("duas entregas simultâneas do mesmo e-mail resultam em um único pedido (concorrência)", async () => {
    const m = mail(7, table("| DJM-020 | Disjuntor | 10 |"));
    const results = await Promise.all([ingestMessage(m, deps()), ingestMessage(m, deps()), ingestMessage(m, deps())]);
    expect(results.filter((r) => r.status === "registered")).toHaveLength(1);
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { sku: "DJM-020" } })).stock).toBe(20000 - 10);
  });

  it("correção na fila revalida e reprocessa; só então registra (HU-06)", async () => {
    const r = await ingestMessage(mail(8, table("| XYZ-123 | Coisa | 3 |")), deps());
    expect(r.status).toBe("exception");

    // corrigir para um SKU ainda inválido mantém na fila: corrigir não pula validação (ADR-005)
    const still = await reprocessOrder(r.orderId!, { items: [{ sku: "ZZZ-000", quantity: 3 }], actor: "Ricardo" }, deps());
    expect(still.status).toBe("exception");

    const fixed = await reprocessOrder(r.orderId!, { items: [{ sku: "djm-020", quantity: 3 }], actor: "Ricardo" }, deps());
    expect(fixed.status).toBe("registered");

    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { exception: true, items: true } });
    expect(order.status).toBe("REGISTERED");
    expect(order.reviewed).toBe(true);
    expect(order.exception?.status).toBe("RESOLVED");
    expect(order.items[0].sku).toBe("DJM-020");
    expect(await prisma.order.count()).toBe(1);

    const events = await prisma.auditEvent.findMany({ where: { orderId: order.id }, orderBy: { at: "asc" } });
    const corr = events.find((e) => e.type === "CORRECTION_APPLIED");
    expect(corr?.actor).toBe("USER");
    expect(corr?.actorName).toBe("Ricardo");
    expect(corr?.data).toMatchObject({ before: { items: [{ sku: "XYZ-123" }] }, after: { items: [{ sku: "ZZZ-000" }] } });
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["EXCEPTION_OPENED", "EXCEPTION_UPDATED", "EXCEPTION_RESOLVED", "ORDER_REGISTERED"]));
  });

  it("não reprocessa pedido já registrado", async () => {
    const r = await ingestMessage(mail(9, table("| DJM-020 | Disjuntor | 1 |")), deps());
    await expect(reprocessOrder(r.orderId!, {}, deps())).rejects.toThrow(/já registrado/);
  });

  it("crédito excedido exige aprovação com justificativa registrada (HU-07, RN-05)", async () => {
    const m = mail(10, table("| CAB-025 | Cabo 2,5mm | 3 |"), mercado.email);
    const r = await ingestMessage(m, deps());
    expect(r).toMatchObject({ status: "exception", reasons: ["CREDIT_LIMIT_EXCEEDED"] });

    const approved = await reprocessOrder(r.orderId!, { approvals: { credit: "Cliente antigo, liberado por telefone" }, actor: "Marlene" }, deps());
    expect(approved.status).toBe("registered");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
    expect(order.approvals).toMatchObject({ credit: { by: "Marlene", reason: "Cliente antigo, liberado por telefone" } });
    expect(await prisma.auditEvent.count({ where: { type: "APPROVAL_GRANTED", orderId: order.id } })).toBe(1);
    const customer = await prisma.customer.findUniqueOrThrow({ where: { cnpj: mercado.cnpj } });
    expect(Number(customer.creditUsed)).toBeGreaterThan(Number(customer.creditLimit)); // aprovado de propósito
  });

  it("valor acima da alçada fica na fila até aprovação (RN-07)", async () => {
    const r = await ingestMessage(mail(11, table("| CAB-100 | Cabo 10mm | 16 |"), SEED_CUSTOMERS[2].email), deps());
    expect(r).toMatchObject({ status: "exception", reasons: ["HIGH_VALUE_APPROVAL"] });
  });
});

describe("pipeline: concorrência e consistência (RN-11)", () => {
  it("dois pedidos disputando o último estoque: um registra, o outro vira exceção, estoque nunca fica negativo", async () => {
    const a = mail(20, `| SKU | D | Q |\n|--|--|--|\n| ${LOW_STOCK_SKU} | Lâmpada | 5 |`, SEED_CUSTOMERS[0].email);
    const b = mail(21, `| SKU | D | Q |\n|--|--|--|\n| ${LOW_STOCK_SKU} | Lâmpada | 5 |`, SEED_CUSTOMERS[1].email);
    const [ra, rb] = await Promise.all([ingestMessage(a, deps()), ingestMessage(b, deps())]);
    expect([ra.status, rb.status].sort()).toEqual(["exception", "registered"]);
    const product = await prisma.product.findUniqueOrThrow({ where: { sku: LOW_STOCK_SKU } });
    expect(product.stock).toBe(0);
    const failed = [ra, rb].find((r) => r.status === "exception")!;
    expect(failed.reasons).toEqual(["OUT_OF_STOCK"]);
  });
});

describe("pipeline: retentativa e falhas (HU-10, RN-12)", () => {
  it("falha transitória nas 2 primeiras tentativas: registra na 3ª e deixa a trilha", async () => {
    const r = await ingestMessage(
      mail(30, table("| DJM-020 | Disjuntor | 2 |")),
      deps({ fault: (stage, attempt) => { if (stage === "extract" && attempt < 3) throw new TransientError("banco indisponível"); } }),
    );
    expect(r.status).toBe("registered");
    expect(await prisma.auditEvent.count({ where: { type: "RETRY_SCHEDULED" } })).toBe(2);
    expect((await prisma.inboundMessage.findFirstOrThrow()).attempts).toBe(3);
    expect(await prisma.order.count()).toBe(1);
  });

  it("falha permanente nas 3 tentativas: nada se perde, cai na fila como PROCESSING_FAILED e pode ser reprocessado", async () => {
    let broken = true;
    const r = await ingestMessage(
      mail(31, table("| DJM-020 | Disjuntor | 2 |")),
      deps({ fault: (stage) => { if (stage === "persist" && broken) throw new TransientError("banco indisponível"); } }),
    );
    expect(r).toMatchObject({ status: "failed", reasons: ["PROCESSING_FAILED"] });
    const msg = await prisma.inboundMessage.findFirstOrThrow();
    expect(msg.status).toBe("FAILED");
    expect(msg.attempts).toBe(3);
    expect(await prisma.exceptionCase.count({ where: { status: "OPEN", primary: "PROCESSING_FAILED" } })).toBe(1);

    broken = false;
    const retried = await reprocessOrder(r.orderId!, { reextract: true, actor: "Ricardo" }, deps());
    expect(retried.status).toBe("registered");
    expect((await prisma.inboundMessage.findFirstOrThrow()).status).toBe("PROCESSED");
  });

  it("erro permanente de extração (anexo inválido) não é repetido e vira exceção", async () => {
    const r = await ingestMessage(mail(32, "anexo", pinheiro.email, { attachment: { filename: "x.pdf", contentBase64: Buffer.from("isto não é pdf").toString("base64") } }), deps());
    expect(r.status).toBe("failed");
    expect((await prisma.inboundMessage.findFirstOrThrow()).attempts).toBe(1);
  });

  it("falha na notificação não derruba o pedido já registrado", async () => {
    const broken: Notifier = { name: "quebrado", send: async () => { throw new Error("canal fora do ar"); } };
    const r = await ingestMessage(mail(33, table("| DJM-020 | Disjuntor | 2 |")), deps({ notifier: broken }));
    expect(r.status).toBe("registered");
    expect(await prisma.auditEvent.count({ where: { type: "NOTIFY_FAILED" } })).toBe(1);
  });
});

describe("pipeline: provedor determinístico de extração (ADR-004)", () => {
  it("usa o FixtureExtractionProvider sem depender do texto do e-mail", async () => {
    const provider = new FixtureExtractionProvider({}, {
      customerCnpj: pinheiro.cnpj,
      items: [{ sku: "INT-001", description: "x", quantity: 7, raw: "" }],
      deadline: null,
      deadlineText: null,
      confidence: 0.99,
      format: "text",
      notes: [],
    });
    const r = await ingestMessage(mail(40, "qualquer coisa ilegível"), deps({ extraction: provider }));
    expect(r.status).toBe("registered");
    const order = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
    expect(order.provider).toBe("fixture");
    expect(order.items[0]).toMatchObject({ sku: "INT-001", quantity: 7 });
  });
});

describe("entrada inválida", () => {
  it("rejeita payload sem remetente válido", async () => {
    await expect(ingestMessage({ from: "nao-e-email", body: "x" }, deps())).rejects.toThrow();
    expect(await prisma.inboundMessage.count()).toBe(0);
  });
});

