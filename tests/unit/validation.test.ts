import { describe, expect, it } from "vitest";
import { validateDraft } from "@/lib/validation";
import type { CustomerSnapshot, ExtractedDraft, ProductSnapshot } from "@/lib/types";

const customer: CustomerSnapshot = {
  id: "c1",
  cnpj: "00.100.000/0001-01",
  name: "Elétrica Pinheiro Ltda",
  email: "compras@pinheiro-eletrica.example",
  creditLimit: 10000,
  creditUsed: 2000,
  active: true,
};
const products: ProductSnapshot[] = [
  { sku: "DJM-020", name: "Disjuntor 20A", aliases: [], price: 15, stock: 100, active: true },
  { sku: "CAB-100", name: "Cabo 10mm", aliases: [], price: 1000, stock: 50, active: true },
  { sku: "OLD-001", name: "Descontinuado", aliases: [], price: 1, stock: 10, active: false },
];
const receivedAt = new Date("2026-03-10T12:00:00Z"); // terça-feira

const item = (sku: string | null, quantity: number | null) => ({ sku, description: "x", quantity, raw: "" });

const draft = (over: Partial<ExtractedDraft> = {}): ExtractedDraft => ({
  customerCnpj: "00.100.000/0001-01",
  items: [item("DJM-020", 10)],
  deadline: "2026-03-15",
  deadlineText: "15/03/2026",
  confidence: 0.95,
  format: "text",
  notes: [],
  ...over,
});

const run = (d: ExtractedDraft, opts: { customers?: CustomerSnapshot[]; approvals?: object; sender?: string } = {}) =>
  validateDraft({
    draft: d,
    senderEmail: opts.sender ?? customer.email,
    customers: opts.customers ?? [customer],
    products,
    receivedAt,
    approvals: opts.approvals ?? {},
  });

describe("validateDraft", () => {
  it("aceita um pedido válido e calcula o total", () => {
    const r = run(draft());
    expect(r.ok).toBe(true);
    expect(r.total).toBe(150);
    expect(r.customer?.id).toBe("c1");
  });

  it("RN-02: identifica cliente pelo e-mail quando não há CNPJ", () => {
    expect(run(draft({ customerCnpj: null })).ok).toBe(true);
  });

  it("RN-02: CNPJ desconhecido gera CUSTOMER_NOT_FOUND", () => {
    expect(run(draft({ customerCnpj: "99.999.999/0001-99" })).primary).toBe("CUSTOMER_NOT_FOUND");
  });

  it("RN-02: remetente desconhecido sem CNPJ gera CUSTOMER_NOT_FOUND", () => {
    const r = run(draft({ customerCnpj: null }), { sender: "x@y.example", customers: [] });
    expect(r.primary).toBe("CUSTOMER_NOT_FOUND");
  });

  it("RN-02: cliente inativo não é aceito", () => {
    expect(run(draft(), { customers: [{ ...customer, active: false }] }).primary).toBe("CUSTOMER_NOT_FOUND");
  });

  it("RN-01: sem itens gera EMPTY_ORDER e não LOW_CONFIDENCE", () => {
    const r = run(draft({ items: [], confidence: 0.3 }));
    expect(r.issues.map((i) => i.code)).toEqual(["EMPTY_ORDER"]);
  });

  it("RN-03: SKU inexistente, inativo ou nulo gera UNKNOWN_SKU", () => {
    expect(run(draft({ items: [item("ZZZ-999", 1)] })).primary).toBe("UNKNOWN_SKU");
    expect(run(draft({ items: [item("OLD-001", 1)] })).primary).toBe("UNKNOWN_SKU");
    expect(run(draft({ items: [item(null, 1)] })).primary).toBe("UNKNOWN_SKU");
  });

  it.each([0, -3, 2.5, 5001, null])("RN-04: quantidade %s é inválida", (q) => {
    expect(run(draft({ items: [item("DJM-020", q)] })).primary).toBe("INVALID_QUANTITY");
  });

  it("RN-04: aceita a quantidade mínima 1", () => {
    expect(run(draft({ items: [item("DJM-020", 1)] })).ok).toBe(true);
  });

  it("RN-06: estoque insuficiente, somando linhas repetidas do mesmo SKU", () => {
    const r = run(draft({ items: [item("DJM-020", 60), item("DJM-020", 60)] }));
    expect(r.issues.map((i) => i.code)).toContain("OUT_OF_STOCK");
  });

  it("RN-06: estoque exatamente igual ao pedido é aceito", () => {
    expect(run(draft({ items: [item("DJM-020", 100)] })).ok).toBe(true);
  });

  it("RN-05: crédito excedido; exatamente no limite disponível passa", () => {
    // disponível = 10.000 - 2.000 = 8.000
    expect(run(draft({ items: [item("CAB-100", 8)] })).ok).toBe(true);
    expect(run(draft({ items: [item("CAB-100", 9)] })).primary).toBe("CREDIT_LIMIT_EXCEEDED");
  });

  it("RN-05: aprovação humana libera o crédito e fica em 'waived'", () => {
    const approvals = { credit: { reason: "Liberado pela gerência", by: "Marlene", at: "2026-03-10T12:00:00Z" } };
    const r = run(draft({ items: [item("CAB-100", 9)] }), { approvals });
    expect(r.ok).toBe(true);
    expect(r.waived[0]).toMatchObject({ code: "CREDIT_LIMIT_EXCEEDED", by: "Marlene" });
  });

  it("RN-07: acima de R$ 15.000 exige aprovação; exatamente R$ 15.000 não", () => {
    const big = { ...customer, creditLimit: 100000 };
    const bigProducts = products.map((p) => (p.sku === "CAB-100" ? { ...p, stock: 100 } : p));
    const base = { senderEmail: customer.email, customers: [big], products: bigProducts, receivedAt, approvals: {} };
    expect(validateDraft({ ...base, draft: draft({ items: [item("CAB-100", 15)] }) }).ok).toBe(true);
    expect(validateDraft({ ...base, draft: draft({ items: [item("CAB-100", 16)] }) }).primary).toBe("HIGH_VALUE_APPROVAL");
  });

  it("RN-08: prazo ausente assume 2 dias úteis (terça -> quinta)", () => {
    const r = run(draft({ deadline: null, deadlineText: null }));
    expect(r.deadline).toBe("2026-03-12");
    expect(r.deadlineAssumed).toBe(true);
  });

  it("RN-08: prazo no passado ou data inexistente gera INVALID_DEADLINE", () => {
    expect(run(draft({ deadline: "2026-03-01" })).primary).toBe("INVALID_DEADLINE");
    expect(run(draft({ deadline: "0000-00-00" })).primary).toBe("INVALID_DEADLINE");
  });

  it("RN-08: prazo no próprio dia do recebimento é aceito", () => {
    expect(run(draft({ deadline: "2026-03-10" })).ok).toBe(true);
  });

  it("RN-09: confiança abaixo de 0,70 gera LOW_CONFIDENCE; exatamente 0,70 passa", () => {
    expect(run(draft({ confidence: 0.69 })).primary).toBe("LOW_CONFIDENCE");
    expect(run(draft({ confidence: 0.7 })).ok).toBe(true);
  });

  it("ordena os motivos por prioridade e guarda todos", () => {
    const r = run(draft({ items: [item("ZZZ-999", 1), item("DJM-020", 500)], confidence: 0.5, deadline: "2026-03-01" }));
    expect(r.issues.map((i) => i.code)).toEqual(["UNKNOWN_SKU", "OUT_OF_STOCK", "INVALID_DEADLINE", "LOW_CONFIDENCE"]);
    expect(r.primary).toBe("UNKNOWN_SKU");
  });
});
