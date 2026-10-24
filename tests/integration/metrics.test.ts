import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { RulesExtractionProvider } from "@/lib/extraction";
import { getDashboard } from "@/lib/metrics";
import { SimulatedNotifier } from "@/lib/notify";
import { ingestMessage, reprocessOrder, type PipelineDeps } from "@/lib/pipeline";
import { SEED_CUSTOMERS, seedDatabase } from "@/lib/seed-data";
import { prisma } from "@/lib/db";

const pinheiro = SEED_CUSTOMERS[0];

const deps = (): PipelineDeps => ({
  extraction: new RulesExtractionProvider(),
  notifier: new SimulatedNotifier(),
  now: () => new Date(),
  retry: { attempts: 3, baseDelayMs: 1, sleep: async () => {} },
});

const mail = (n: number, rows: string) => ({
  messageId: `<metrics-${n}@test.example>`,
  from: pinheiro.email,
  subject: `Pedido ${n}`,
  body: `| SKU | Descrição | Qtd |\n|---|---|---|\n${rows}`,
});

beforeEach(async () => {
  await seedDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("painel: indicadores calculados do banco (HU-08, RF-12)", () => {
  it("banco vazio: zeros e latências nulas, sem divisão por zero", async () => {
    const m = await getDashboard();
    expect(m.totalOrders).toBe(0);
    expect(m.reviewRate).toBe(0);
    expect(m.latencyMs.autoAvg).toBeNull();
    expect(m.reasons).toEqual([]);
    expect(m.oldestOpenExceptionAt).toBeNull();
  });

  it("conta status, taxa de revisão, motivos, reenvios e fila aberta", async () => {
    await ingestMessage(mail(1, "| DJM-020 | Disjuntor | 5 |"), deps());
    const exc = await ingestMessage(mail(2, "| TOM-099 | Inexistente | 3 |"), deps());
    expect(exc.status).toBe("exception");
    await ingestMessage(mail(1, "| DJM-020 | Disjuntor | 5 |"), deps()); // reenvio

    const m = await getDashboard();
    expect(m.totalOrders).toBe(2);
    expect(m.byStatus).toEqual({ registered: 1, exceptionOpen: 1, exceptionResolved: 0 });
    expect(m.reviewedOrders).toBe(1);
    expect(m.reviewRate).toBe(0.5);
    expect(m.reasons).toEqual([{ code: "UNKNOWN_SKU", count: 1 }]);
    expect(m.duplicatesIgnored).toBe(1);
    expect(m.openExceptions).toBe(1);
    expect(m.oldestOpenExceptionAt).toBeInstanceOf(Date);
    expect(m.failedMessages).toBe(0);
    expect(m.latencyMs.autoAvg).not.toBeNull();
  });

  it("depois da correção a exceção passa a resolvida e a fila fica vazia", async () => {
    const exc = await ingestMessage(mail(3, "| TOM-099 | Inexistente | 3 |"), deps());
    await reprocessOrder(exc.orderId!, { items: [{ sku: "DJM-020", quantity: 3 }], actor: "Operador" }, deps());

    const m = await getDashboard();
    expect(m.byStatus).toEqual({ registered: 1, exceptionOpen: 0, exceptionResolved: 1 });
    expect(m.openExceptions).toBe(0);
    expect(m.oldestOpenExceptionAt).toBeNull();
    expect(m.reviewRate).toBe(1);
    expect(m.latencyMs.reviewedAvg).not.toBeNull();
  });
});
