/**
 * Teste de carga simples (Fase 6): envia N e-mails de exemplo ao endpoint /api/inbound,
 * mede o tempo e compara a decisão do pipeline com o rótulo esperado do gerador.
 *
 * ATENÇÃO: zera os dados transacionais do banco apontado por DATABASE_URL (seed).
 * Uso: npm run load -- [quantidade=500] [semente=42] [concorrência=8]
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { generateMessages, type GeneratedMessage } from "../../src/lib/generator";
import { seedDatabase } from "../../src/lib/seed-data";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3100";
const KEY = process.env.INBOUND_API_KEY ?? "chave-local-de-exemplo";
const count = Number(process.argv[2] ?? 500);
const seed = Number(process.argv[3] ?? 42);
const concurrency = Number(process.argv[4] ?? 8);

interface Outcome {
  expected: string;
  actual: string;
  scenario: string;
  ms: number;
}

async function send(m: GeneratedMessage): Promise<Outcome> {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/inbound`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY },
    body: JSON.stringify(m.payload),
  });
  const ms = performance.now() - t0;
  const body = (await res.json()) as { status?: string; reasons?: string[] };
  const actual =
    body.status === "registered" ? "REGISTERED" : body.status === "duplicate" ? "DUPLICATE" : (body.reasons?.[0] ?? `HTTP_${res.status}`);
  return { expected: m.expected, actual, scenario: m.scenario, ms };
}

async function pool(items: GeneratedMessage[], size: number): Promise<Outcome[]> {
  const results: Outcome[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await send(items[i]);
      }
    }),
  );
  return results;
}

const pctile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

async function main() {
  const health = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error(`Servidor não está respondendo em ${BASE}. Rode "npm run build && npm run start".`);

  const prisma = new PrismaClient();
  await seedDatabase(prisma);
  await prisma.$disconnect();

  const messages = generateMessages(count, seed);
  const originals = messages.filter((m) => m.scenario !== "resend");
  const resends = messages.filter((m) => m.scenario === "resend");

  console.log(`Enviando ${messages.length} e-mails (${originals.length} originais + ${resends.length} reenvios), concorrência ${concurrency}...`);
  const t0 = performance.now();
  // Reenvios só saem depois dos originais: um reenvio é, por natureza, posterior ao e-mail original.
  const first = await pool(originals, concurrency);
  const second = await pool(resends, concurrency);
  const elapsedMs = performance.now() - t0;
  const all = [...first, ...second];

  const lat = all.map((o) => o.ms).sort((a, b) => a - b);
  const outcomes: Record<string, number> = {};
  for (const o of all) outcomes[o.actual] = (outcomes[o.actual] ?? 0) + 1;
  const mismatches = all.filter((o) => o.expected !== o.actual);

  const metrics = (await (await fetch(`${BASE}/api/metrics`)).json()) as {
    totalOrders: number;
    reviewedOrders: number;
    reviewRate: number;
    latencyMs: { autoAvg: number | null; autoP50: number | null; autoP95: number | null };
  };

  const result = {
    generatedAt: new Date().toISOString(),
    messages: messages.length,
    seed,
    concurrency,
    elapsedMs: Math.round(elapsedMs),
    throughputPerSec: messages.length / (elapsedMs / 1000),
    requestLatencyMs: {
      avg: lat.reduce((a, b) => a + b, 0) / lat.length,
      p50: pctile(lat, 0.5),
      p95: pctile(lat, 0.95),
      max: lat[lat.length - 1],
    },
    outcomes,
    expectedAgreement: { matched: all.length - mismatches.length, total: all.length },
    mismatches: mismatches.map((m) => ({ scenario: m.scenario, expected: m.expected, actual: m.actual })),
    db: {
      totalOrders: metrics.totalOrders,
      reviewedOrders: metrics.reviewedOrders,
      reviewRate: metrics.reviewRate,
      autoAvgMs: metrics.latencyMs.autoAvg,
      autoP50Ms: metrics.latencyMs.autoP50,
      autoP95Ms: metrics.latencyMs.autoP95,
    },
  };

  const out = path.join(__dirname, "..", "..", "docs", "04-processo", "medicao-resultados.json");
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nResultado gravado em ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
