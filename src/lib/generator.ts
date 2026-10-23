import { addDays, toISODate } from "./business-days";
import { createSimplePdf } from "./pdf";
import {
  CREDIT_TIGHT_CUSTOMER_CNPJ,
  EVERYDAY_SKUS,
  LOW_STOCK_SKU,
  SEED_CUSTOMERS,
  SEED_PRODUCTS,
  type SeedCustomer,
  type SeedProduct,
} from "./seed-data";
import type { ExceptionCode, InboundPayload } from "./types";

/**
 * Gerador de pedidos de exemplo. Cada mensagem sai com o resultado ESPERADO (rótulo), o que permite
 * medir a concordância entre o que eu esperava e o que o pipeline decidiu. Os pesos abaixo são escolha
 * minha: a taxa de revisão do conjunto gerado é consequência deles, não uma previsão do mundo real.
 */
export type Scenario =
  | "clean-table"
  | "clean-text"
  | "clean-pdf"
  | "unknown-sku"
  | "unknown-customer"
  | "over-credit"
  | "out-of-stock"
  | "vague"
  | "approximate"
  | "high-value"
  | "past-deadline"
  | "resend";

export type Expected = "REGISTERED" | "DUPLICATE" | ExceptionCode;

export const SCENARIO_WEIGHTS: Record<Scenario, number> = {
  "clean-table": 25,
  "clean-text": 30,
  "clean-pdf": 10,
  "unknown-sku": 5,
  "unknown-customer": 4,
  "over-credit": 4,
  "out-of-stock": 5,
  vague: 2,
  approximate: 2,
  "high-value": 3,
  "past-deadline": 2,
  resend: 8,
};

export const SCENARIO_EXPECTED: Record<Exclude<Scenario, "resend">, Expected> = {
  "clean-table": "REGISTERED",
  "clean-text": "REGISTERED",
  "clean-pdf": "REGISTERED",
  "unknown-sku": "UNKNOWN_SKU",
  "unknown-customer": "CUSTOMER_NOT_FOUND",
  "over-credit": "CREDIT_LIMIT_EXCEEDED",
  "out-of-stock": "OUT_OF_STOCK",
  vague: "EMPTY_ORDER",
  approximate: "LOW_CONFIDENCE",
  "high-value": "HIGH_VALUE_APPROVAL",
  "past-deadline": "INVALID_DEADLINE",
};

export interface GeneratedMessage {
  scenario: Scenario;
  expected: Expected;
  payload: InboundPayload;
}

/** PRNG determinístico (mulberry32) para o gerador ser reprodutível a partir da semente. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
    chance: (p: number) => next() < p,
  };
}
type Rng = ReturnType<typeof createRng>;

const GREETINGS = ["Bom dia", "Boa tarde", "Olá", "Prezados", "Oi, tudo bem?"];
const CLOSINGS = ["Obrigado!", "Att,", "Abraço", "Grato", "Fico no aguardo."];

const normalCustomers = SEED_CUSTOMERS.filter((c) => c.active && c.cnpj !== CREDIT_TIGHT_CUSTOMER_CNPJ);
const brDate = (iso: string) => iso.split("-").reverse().join("/");

interface Line {
  product: SeedProduct;
  qty: number;
}

function pickLines(rng: Rng, n: number): Line[] {
  const chosen = new Set<string>();
  const lines: Line[] = [];
  while (lines.length < n) {
    const product = rng.pick(EVERYDAY_SKUS);
    if (chosen.has(product.sku)) continue;
    chosen.add(product.sku);
    lines.push({ product, qty: product.unit === "rolo" ? rng.int(1, 3) : rng.int(2, 40) });
  }
  return lines;
}

function textLine(rng: Rng, l: Line): string {
  const alias = l.product.aliases[0] ?? l.product.name.toLowerCase();
  const plural = rng.chance(0.3) && /^[a-zà-ú ]+$/i.test(alias) ? `${alias}s` : alias;
  const unit = l.product.unit === "rolo" ? (l.qty > 1 ? "rolos de " : "rolo de ") : "";
  switch (rng.int(0, 3)) {
    case 0:
      return `${l.qty} ${unit}${plural}`;
    case 1:
      return `${l.qty}x ${l.product.name}`;
    case 2:
      return `${alias} - ${l.qty}`;
    default:
      return `${l.qty} un de ${l.product.sku}`;
  }
}

function deadlineLine(rng: Rng, now: Date): string {
  if (!rng.chance(0.5)) return "";
  const d = addDays(now, rng.int(2, 7));
  return rng.chance(0.5) ? `Prazo de entrega: ${brDate(toISODate(d))}` : `Entrega até ${brDate(toISODate(d))}`;
}

function wrapText(rng: Rng, customer: SeedCustomer, lines: string[], index: number, withCnpj: boolean, now: Date, extra: string[] = []) {
  return [
    `${rng.pick(GREETINGS)},`,
    `Pedido de compra nº ${1000 + index}`,
    "",
    "Preciso de:",
    ...lines,
    ...extra,
    "",
    deadlineLine(rng, now),
    withCnpj ? `CNPJ: ${customer.cnpj}` : "",
    rng.pick(CLOSINGS),
    customer.name,
  ]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");
}

function tableBody(customer: SeedCustomer, lines: { sku: string; desc: string; qty: number }[], index: number, now: Date, rng: Rng, withCnpj: boolean) {
  const head = `Segue pedido de compra nº ${1000 + index} da ${customer.name}.`;
  const rows = lines.map((l) => `| ${l.sku} | ${l.desc} | ${l.qty} |`);
  return [head, withCnpj ? `CNPJ: ${customer.cnpj}` : "", "", "| SKU | Descrição | Qtd |", "|---|---|---|", ...rows, "", deadlineLine(rng, now)]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");
}

function newMessageId(seed: number, index: number, customer: SeedCustomer): string {
  const domain = customer.email.split("@")[1];
  return `<gen-${seed}-${index}@${domain}>`;
}

export function generateMessages(count: number, seed = 42, now = new Date()): GeneratedMessage[] {
  const rng = createRng(seed);
  const scenarios = Object.keys(SCENARIO_WEIGHTS) as Scenario[];
  const totalWeight = scenarios.reduce((s, k) => s + SCENARIO_WEIGHTS[k], 0);
  const pickScenario = (): Scenario => {
    let r = rng.next() * totalWeight;
    for (const s of scenarios) {
      r -= SCENARIO_WEIGHTS[s];
      if (r <= 0) return s;
    }
    return "clean-text";
  };

  const out: GeneratedMessage[] = [];
  for (let i = 0; i < count; i++) {
    let scenario = pickScenario();
    if (scenario === "resend" && out.length === 0) scenario = "clean-text";

    if (scenario === "resend") {
      const original = rng.pick(out.filter((m) => m.scenario !== "resend"));
      const sameId = rng.chance(0.5);
      out.push({
        scenario,
        expected: "DUPLICATE",
        payload: {
          ...original.payload,
          messageId: sameId ? original.payload.messageId : `<resend-${seed}-${i}@${original.payload.from.split("@")[1]}>`,
        },
      });
      continue;
    }

    const customer = rng.pick(normalCustomers);
    const withCnpj = rng.chance(0.5);
    const base = { from: customer.email, messageId: newMessageId(seed, i, customer) };
    let subject = "Pedido";
    let body = "";
    let attachment: InboundPayload["attachment"];

    switch (scenario) {
      case "clean-table": {
        const lines = pickLines(rng, rng.int(1, 5)).map((l) => ({ sku: l.product.sku, desc: l.product.name, qty: l.qty }));
        body = tableBody(customer, lines, i, now, rng, withCnpj);
        subject = `Pedido de compra ${1000 + i}`;
        break;
      }
      case "clean-text": {
        const lines = pickLines(rng, rng.int(1, 4)).map((l) => textLine(rng, l));
        body = wrapText(rng, customer, lines, i, withCnpj, now);
        subject = rng.pick(["Pedido", "Preciso de material", "Pedido urgente", "Compra da semana"]);
        break;
      }
      case "clean-pdf": {
        const lines = pickLines(rng, rng.int(1, 5));
        const pdf = createSimplePdf([
          `PEDIDO DE COMPRA No ${1000 + i}`,
          `Cliente: ${customer.name}`,
          `CNPJ: ${customer.cnpj}`,
          "",
          ...lines.map((l) => `${l.product.sku} | ${l.product.name} | ${l.qty}`),
          "",
          deadlineLine(rng, now),
        ]);
        attachment = { filename: `pedido-${1000 + i}.pdf`, contentBase64: pdf.toString("base64") };
        body = `${rng.pick(GREETINGS)}, segue o pedido em anexo (ref. ${1000 + i}).`;
        subject = `Pedido ${1000 + i} em PDF`;
        break;
      }
      case "unknown-sku": {
        const lines = pickLines(rng, rng.int(1, 2)).map((l) => textLine(rng, l));
        lines.push(`${rng.int(2, 20)} un de ${rng.pick(["XYZ-123", "TOM-099", "ABC-777"])}`);
        body = wrapText(rng, customer, lines, i, withCnpj, now);
        break;
      }
      case "unknown-customer": {
        const lines = pickLines(rng, rng.int(1, 3)).map((l) => textLine(rng, l));
        base.from = `compras${i}@cliente-novo.example`;
        body = wrapText(rng, { ...customer, cnpj: "99.999.999/0001-99", name: "Cliente Novo ME" }, lines, i, true, now);
        break;
      }
      case "over-credit": {
        const tight = SEED_CUSTOMERS.find((c) => c.cnpj === CREDIT_TIGHT_CUSTOMER_CNPJ)!;
        base.from = tight.email;
        base.messageId = newMessageId(seed, i, tight);
        body = wrapText(rng, tight, [`${rng.int(3, 5)} rolos de cabo 2,5mm`], i, true, now);
        break;
      }
      case "out-of-stock": {
        const low = SEED_PRODUCTS.find((p) => p.sku === LOW_STOCK_SKU)!;
        body = wrapText(rng, customer, [`${rng.int(40, 80)} un de ${low.sku}`], i, withCnpj, now);
        break;
      }
      case "vague": {
        body = `${rng.pick(GREETINGS)}! Pode mandar aquele pedido de sempre, igual ao da semana passada? (ref. ${1000 + i})\n${customer.name}`;
        subject = "Aquele pedido";
        break;
      }
      case "approximate": {
        body = wrapText(rng, customer, [`uns ${rng.int(10, 30)} disjuntor 20A`], i, withCnpj, now);
        break;
      }
      case "high-value": {
        const big = SEED_CUSTOMERS[2];
        base.from = big.email;
        base.messageId = newMessageId(seed, i, big);
        body = tableBody(big, [{ sku: "CAB-100", desc: "Cabo flexível 10mm (rolo 100m)", qty: rng.int(14, 20) }], i, now, rng, true);
        subject = `Pedido obra ${1000 + i}`;
        break;
      }
      case "past-deadline": {
        const lines = pickLines(rng, rng.int(1, 3)).map((l) => textLine(rng, l));
        const past = brDate(toISODate(addDays(now, -rng.int(3, 10))));
        body = wrapText(rng, customer, lines, i, withCnpj, now, [`Prazo de entrega: ${past}`]);
        break;
      }
    }

    out.push({
      scenario,
      expected: SCENARIO_EXPECTED[scenario],
      payload: { ...base, subject, body, ...(attachment ? { attachment } : {}) },
    });
  }
  return out;
}

export function customerByCnpj(cnpj: string) {
  return SEED_CUSTOMERS.find((c) => c.cnpj === cnpj);
}
