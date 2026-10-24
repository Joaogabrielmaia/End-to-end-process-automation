import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { RulesExtractionProvider } from "@/lib/extraction";
import { SimulatedNotifier } from "@/lib/notify";
import { ingestMessage, type PipelineDeps } from "@/lib/pipeline";
import { SEED_CUSTOMERS, seedDatabase } from "@/lib/seed-data";
import { prisma } from "@/lib/db";

const deps = (): PipelineDeps => ({
  extraction: new RulesExtractionProvider(),
  notifier: new SimulatedNotifier(),
  now: () => new Date(),
  retry: { attempts: 3, baseDelayMs: 1, sleep: async () => {} },
});

// Só clientes com crédito livre: o de crédito curto geraria CREDIT_LIMIT_EXCEEDED (RN-05), o que não é o objeto deste teste.
const active = SEED_CUSTOMERS.filter((c) => c.active && c.creditLimit - c.creditUsed > 5000);

beforeEach(async () => {
  await seedDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("regressão do deadlock achado na carga (RN-11, RN-12)", () => {
  it("pedidos simultâneos com os mesmos SKUs em ordens opostas são todos registrados", async () => {
    const orders = Array.from({ length: 40 }, (_, i) => {
      const rows = i % 2 === 0 ? ["| DJM-020 | Disjuntor | 1 |", "| CAB-040 | Cabo | 1 |"] : ["| CAB-040 | Cabo | 1 |", "| DJM-020 | Disjuntor | 1 |"];
      return {
        messageId: `<deadlock-${i}@test.example>`,
        from: active[i % active.length].email,
        subject: `Pedido ${i}`,
        body: `| SKU | Descrição | Qtd |\n|---|---|---|\n${rows.join("\n")}`,
      };
    });

    const results = await Promise.all(orders.map((o) => ingestMessage(o, deps())));

    expect(results.filter((r) => r.status === "failed")).toEqual([]);
    expect(results.filter((r) => r.status === "registered")).toHaveLength(40);
    expect(await prisma.auditEvent.count({ where: { type: "PROCESSING_FAILED" } })).toBe(0);

    const djm = await prisma.product.findUniqueOrThrow({ where: { sku: "DJM-020" } });
    const cab = await prisma.product.findUniqueOrThrow({ where: { sku: "CAB-040" } });
    expect(djm.stock).toBe(20000 - 40);
    expect(cab.stock).toBe(1500 - 40);
  });
});
