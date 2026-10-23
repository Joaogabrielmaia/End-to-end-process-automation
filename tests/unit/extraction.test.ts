import { describe, expect, it } from "vitest";
import { RulesExtractionProvider } from "@/lib/extraction";
import { createSimplePdf, extractPdfText } from "@/lib/pdf";
import { SEED_PRODUCTS } from "@/lib/seed-data";

const catalog = SEED_PRODUCTS.map((p) => ({ sku: p.sku, name: p.name, aliases: p.aliases }));
const receivedAt = new Date("2026-03-10T12:00:00Z"); // terça-feira
const provider = new RulesExtractionProvider();

const run = (body: string, attachmentText?: string) =>
  provider.extract({ messageId: "m1", fromEmail: "a@b.example", subject: "Pedido", body, attachmentText, receivedAt, catalog });

describe("RulesExtractionProvider (RF-03)", () => {
  it("extrai texto livre informal com plural e quantidade antes do nome (HU-02)", async () => {
    const d = await run("Bom dia,\npreciso de 20 disjuntor 20A, 5 rolos de cabo 2,5mm e 10 tomadas 20A.\nAtt, Antônio");
    expect(d.items.map((i) => [i.sku, i.quantity])).toEqual([
      ["DJM-020", 20],
      ["CAB-025", 5],
      ["TOM-020", 10],
    ]);
    expect(d.confidence).toBeGreaterThanOrEqual(0.7);
    expect(d.format).toBe("text");
  });

  it("regressão: saudação na mesma linha do pedido não descarta a linha (achado ao testar via curl)", async () => {
    const d = await run("Bom dia, preciso de 20 disjuntor 20A, 5 rolos de cabo 2,5mm e 10 tomadas 20A. Prazo: 30/10/2026");
    expect(d.items.map((i) => [i.sku, i.quantity])).toEqual([
      ["DJM-020", 20],
      ["CAB-025", 5],
      ["TOM-020", 10],
    ]);
    expect(d.deadline).toBe("2026-10-30");
  });

  it("extrai tabela em markdown com SKU e alta confiança", async () => {
    const d = await run("| SKU | Descrição | Qtd |\n|---|---|---|\n| DJM-025 | Disjuntor | 12 |\n| INT-001 | Interruptor simples | 30 |");
    expect(d.format).toBe("table");
    expect(d.items.map((i) => [i.sku, i.quantity])).toEqual([["DJM-025", 12], ["INT-001", 30]]);
    expect(d.confidence).toBe(0.95);
  });

  it("extrai CNPJ e prazo do texto", async () => {
    const d = await run("2 un de TOM-010\nCNPJ: 00.100.000/0001-01\nPrazo de entrega: 20/03/2026");
    expect(d.customerCnpj).toBe("00.100.000/0001-01");
    expect(d.deadline).toBe("2026-03-20");
  });

  it("devolve SKU nulo para item que parece item mas não está no catálogo", async () => {
    const d = await run("3 dobradiça de aço inox");
    expect(d.items).toHaveLength(1);
    expect(d.items[0].sku).toBeNull();
    expect(d.items[0].quantity).toBe(3);
  });

  it("marca confiança baixa para quantidade aproximada", async () => {
    const d = await run("preciso de uns 10 disjuntor 20A");
    expect(d.items[0]).toMatchObject({ sku: "DJM-020", quantity: 10 });
    expect(d.confidence).toBeLessThan(0.7);
  });

  it("não inventa itens para pedido vago", async () => {
    const d = await run("Bom dia! Pode mandar aquele pedido de sempre, igual ao da semana passada?");
    expect(d.items).toHaveLength(0);
    expect(d.confidence).toBeLessThan(0.7);
  });

  it("lê PDF simples gerado pelo próprio projeto", async () => {
    const pdf = createSimplePdf(["PEDIDO DE COMPRA No 1", "Cliente: Elétrica Pinheiro Ltda", "CNPJ: 00.100.000/0001-01", "DJM-020 | Disjuntor monopolar 20A | 20"]);
    const text = extractPdfText(pdf);
    expect(text).toContain("Elétrica Pinheiro Ltda");
    const d = await run("segue em anexo", text);
    expect(d.format).toBe("pdf");
    expect(d.items.map((i) => [i.sku, i.quantity])).toEqual([["DJM-020", 20]]);
    expect(d.customerCnpj).toBe("00.100.000/0001-01");
  });

  it("recusa anexo que não é PDF", () => {
    expect(() => extractPdfText(Buffer.from("texto qualquer"))).toThrow();
  });
});
