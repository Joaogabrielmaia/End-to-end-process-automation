import { addBusinessDays, fromISODate, toISODate } from "./business-days";
import {
  DEFAULT_DEADLINE_BUSINESS_DAYS,
  EXCEPTION_CODES,
  HIGH_VALUE_LIMIT,
  MAX_LINE_QUANTITY,
  MIN_CONFIDENCE,
  type Approvals,
  type CustomerSnapshot,
  type ExceptionCode,
  type ExtractedDraft,
  type Issue,
  type ProductSnapshot,
} from "./types";

export interface ValidationInput {
  draft: ExtractedDraft;
  senderEmail: string;
  /** Candidatos já carregados (por CNPJ e por e-mail do remetente). */
  customers: CustomerSnapshot[];
  products: ProductSnapshot[];
  receivedAt: Date;
  approvals: Approvals;
}

export interface ResolvedItem {
  sku: string | null;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
}

export interface ValidationResult {
  ok: boolean;
  issues: Issue[];
  /** Pendências que existiam mas foram liberadas por aprovação humana. */
  waived: { code: ExceptionCode; reason: string; by: string }[];
  customer: CustomerSnapshot | null;
  items: ResolvedItem[];
  total: number;
  deadline: string | null;
  deadlineAssumed: boolean;
  primary: ExceptionCode | null;
}

const digits = (s: string) => s.replace(/\D/g, "");
const round2 = (n: number) => Math.round(n * 100) / 100;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** RN-02: CNPJ do texto primeiro; sem CNPJ, e-mail do remetente. */
export function identifyCustomer(
  cnpj: string | null,
  senderEmail: string,
  customers: CustomerSnapshot[],
): { customer: CustomerSnapshot | null; issue?: Issue } {
  let found: CustomerSnapshot | undefined;
  if (cnpj) found = customers.find((c) => digits(c.cnpj) === digits(cnpj));
  else found = customers.find((c) => c.email.toLowerCase() === senderEmail.toLowerCase());

  if (!found) {
    const how = cnpj ? `CNPJ ${cnpj}` : `remetente ${senderEmail} (sem CNPJ no texto)`;
    return { customer: null, issue: { code: "CUSTOMER_NOT_FOUND", detail: `Nenhum cliente cadastrado para ${how}.` } };
  }
  if (!found.active) {
    return { customer: null, issue: { code: "CUSTOMER_NOT_FOUND", detail: `Cliente ${found.name} está inativo.` } };
  }
  return { customer: found };
}

/** Função pura: aplica RN-01 a RN-09. Sem acesso a banco, rede ou relógio (ADR-002). */
export function validateDraft(input: ValidationInput): ValidationResult {
  const { draft, products, approvals } = input;
  const issues: Issue[] = [];
  const waived: ValidationResult["waived"] = [];
  const bySku = new Map(products.map((p) => [p.sku, p]));

  // RN-02
  const { customer, issue: customerIssue } = identifyCustomer(draft.customerCnpj, input.senderEmail, input.customers);
  if (customerIssue) issues.push(customerIssue);

  // RN-01 (sem itens)
  if (draft.items.length === 0) {
    issues.push({ code: "EMPTY_ORDER", detail: "Não encontrei nenhum item no pedido." });
  }

  // RN-03 e RN-04
  const items: ResolvedItem[] = [];
  const qtyBySku = new Map<string, number>();
  for (const it of draft.items) {
    const product = it.sku ? bySku.get(it.sku) : undefined;
    if (!it.sku || !product || !product.active) {
      issues.push({
        code: "UNKNOWN_SKU",
        sku: it.sku ?? undefined,
        detail: it.sku
          ? `SKU ${it.sku} ${product ? "está inativo" : "não existe no cadastro"}.`
          : `Não consegui associar "${it.description}" a nenhum produto.`,
      });
      items.push({ sku: it.sku, description: it.description, quantity: it.quantity, unitPrice: null, lineTotal: null });
      continue;
    }
    const q = it.quantity;
    if (q === null || !Number.isInteger(q) || q <= 0 || q > MAX_LINE_QUANTITY) {
      issues.push({
        code: "INVALID_QUANTITY",
        sku: it.sku,
        detail: `Quantidade inválida para ${it.sku}: ${q === null ? "não identificada" : q}. Aceito inteiros de 1 a ${MAX_LINE_QUANTITY}.`,
      });
      items.push({ sku: it.sku, description: product.name, quantity: q, unitPrice: product.price, lineTotal: null });
      continue;
    }
    qtyBySku.set(it.sku, (qtyBySku.get(it.sku) ?? 0) + q);
    items.push({
      sku: it.sku,
      description: product.name,
      quantity: q,
      unitPrice: product.price,
      lineTotal: round2(q * product.price),
    });
  }

  // RN-06 (soma por SKU, sem atendimento parcial)
  for (const [sku, qty] of qtyBySku) {
    const p = bySku.get(sku)!;
    if (qty > p.stock) {
      issues.push({
        code: "OUT_OF_STOCK",
        sku,
        detail: `${sku} (${p.name}): pedido ${qty}, estoque disponível ${p.stock}.`,
      });
    }
  }

  const total = round2(items.reduce((s, i) => s + (i.lineTotal ?? 0), 0));

  // RN-05
  if (customer) {
    const available = round2(customer.creditLimit - customer.creditUsed);
    if (total > available) {
      const detail = `Total ${brl(total)} excede o crédito disponível ${brl(available)} (limite ${brl(customer.creditLimit)}).`;
      if (approvals.credit) waived.push({ code: "CREDIT_LIMIT_EXCEEDED", reason: approvals.credit.reason, by: approvals.credit.by });
      else issues.push({ code: "CREDIT_LIMIT_EXCEEDED", detail });
    }
  }

  // RN-07
  if (total > HIGH_VALUE_LIMIT) {
    const detail = `Total ${brl(total)} acima da alçada de ${brl(HIGH_VALUE_LIMIT)}; exige aprovação.`;
    if (approvals.highValue) waived.push({ code: "HIGH_VALUE_APPROVAL", reason: approvals.highValue.reason, by: approvals.highValue.by });
    else issues.push({ code: "HIGH_VALUE_APPROVAL", detail });
  }

  // RN-08
  const receivedDay = toISODate(input.receivedAt);
  let deadline = draft.deadline;
  let deadlineAssumed = false;
  if (!deadline) {
    deadline = toISODate(addBusinessDays(input.receivedAt, DEFAULT_DEADLINE_BUSINESS_DAYS));
    deadlineAssumed = true;
  } else if (Number.isNaN(fromISODate(deadline).getTime()) || deadline < receivedDay) {
    issues.push({
      code: "INVALID_DEADLINE",
      detail: `Prazo ${draft.deadlineText ?? deadline} é inválido ou anterior ao recebimento (${receivedDay}).`,
    });
  }

  // RN-09 (se não há itens, o motivo certo é EMPTY_ORDER)
  if (draft.items.length > 0 && draft.confidence < MIN_CONFIDENCE) {
    issues.push({
      code: "LOW_CONFIDENCE",
      detail: `Confiança da extração ${draft.confidence.toFixed(2)} abaixo de ${MIN_CONFIDENCE.toFixed(2)}. ${draft.notes.join(" ")}`.trim(),
    });
  }

  issues.sort((a, b) => EXCEPTION_CODES.indexOf(a.code) - EXCEPTION_CODES.indexOf(b.code));

  return {
    ok: issues.length === 0,
    issues,
    waived,
    customer,
    items,
    total,
    deadline,
    deadlineAssumed,
    primary: issues[0]?.code ?? null,
  };
}
