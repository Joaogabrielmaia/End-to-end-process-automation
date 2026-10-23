import { parseDeadlineText } from "../business-days";
import type { DraftItem, ExtractedDraft } from "../types";
import type { CatalogEntry, ExtractionInput, ExtractionProvider } from "./provider";

const SKU_RE = /\b([a-z]{2,3}-\d{3})\b/i;
const CNPJ_RE = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/;
const NOISE_LINE_RE =
  /^(de|para|assunto|enviado|date|data|att|atenciosamente|abraco|abracos|obrigad|grato|bom dia|boa tarde|boa noite|ola|oi|prezados?|cnpj|cliente|empresa|prazo|entrega|ref|pedido de compra|tel|fone|endereco|obs)\b/;
const VAGUE_RE = /\b(de sempre|mesmo pedido|igual (a|ao|da|do)|aquele pedido|o mesmo)\b/;
const APPROX_RE = /\b(uns|umas|mais ou menos|cerca de|aproximadamente|por volta de)\s+\d/;

/** Minúsculas, sem acentos, "20 A" vira "20a", "2,5 mm" vira "2,5mm". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)\s+(a|mm|w|m|v)\b/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Singulariza de forma tosca (tira "s" final de palavras com 4+ letras) para casar "tomadas" com "tomada". */
function stem(s: string): string {
  return s
    .split(" ")
    .map((w) => {
      if (w.length <= 3 || /\d/.test(w)) return w;
      if (/(res|zes)$/.test(w)) return w.slice(0, -2); // disjuntores -> disjuntor
      return w.endsWith("s") ? w.slice(0, -1) : w;
    })
    .join(" ");
}

interface Matcher {
  sku: string;
  names: string[];
}

function buildMatchers(catalog: CatalogEntry[]): Matcher[] {
  return catalog
    .map((c) => ({
      sku: c.sku,
      names: Array.from(new Set([c.name, ...c.aliases].map((n) => stem(normalize(n))))).filter(Boolean),
    }))
    .sort((a, b) => Math.max(...b.names.map((n) => n.length)) - Math.max(...a.names.map((n) => n.length)));
}

const QTY_RE = /(?:^|[\s(x])(\d{1,6})(?:\s*(?:x|un|und|unid\w*|pcs?|pecas?|rolos?|caixas?|cx|metros?|m)\b)?(?=$|[\s,.;)x])/;

function pickQuantity(rest: string): number | null {
  const cleaned = rest.replace(/\b(uns|umas|cerca de|aproximadamente|mais ou menos)\b/g, " ");
  const m = QTY_RE.exec(` ${cleaned} `);
  return m ? Number(m[1]) : null;
}

function splitSegments(line: string): string[] {
  return line
    .split(/[;]|,(?!\d)|\s+e\s+(?=\d)|\s+\+\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchCatalog(segment: string, matchers: Matcher[]): { sku: string; rest: string } | null {
  const text = stem(normalize(segment));
  for (const m of matchers) {
    for (const name of m.names) {
      const idx = text.indexOf(name);
      if (idx >= 0) {
        const before = idx === 0 || text[idx - 1] === " ";
        const afterIdx = idx + name.length;
        const after = afterIdx === text.length || text[afterIdx] === " " || /[^a-z0-9]/.test(text[afterIdx]);
        if (before && after) return { sku: m.sku, rest: (text.slice(0, idx) + " " + text.slice(afterIdx)).trim() };
      }
    }
  }
  return null;
}

const ITEM_LIKE_QTY_FIRST = /^\s*(?:uns\s+)?(\d{1,6})\s*(?:x|un\w*|rolos?|cx|caixas?|pe[cç]as?|pcs?)?\s+(?:de\s+)?([a-zà-ú][\wà-ú .,/-]{2,})$/i;
const ITEM_LIKE_QTY_LAST = /^\s*([a-zà-ú][\wà-ú .,/-]{2,}?)\s*(?:[:\-]|x)\s*(\d{1,6})\s*(?:un\w*|rolos?|cx|caixas?)?$/i;

function parseTableLine(line: string): DraftItem | null {
  if (!/[|;\t]/.test(line)) return null;
  const cells = line
    .split(/[|;\t]/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cells.length < 2) return null;
  if (cells.every((c) => /^[-:\s]+$/.test(c))) return null;
  const skuCell = cells.find((c) => /^[a-z]{2,3}-\d{3}$/i.test(c));
  if (!skuCell) return null;
  const qtyCell = cells.find((c) => c !== skuCell && /^\d{1,6}(?:[.,]\d+)?$/.test(c));
  const desc = cells.find((c) => c !== skuCell && c !== qtyCell && /[a-zà-ú]/i.test(c)) ?? skuCell;
  const quantity = qtyCell ? Number(qtyCell.replace(",", ".")) : null;
  return { sku: skuCell.toUpperCase(), description: desc, quantity, raw: line.trim() };
}

export class RulesExtractionProvider implements ExtractionProvider {
  readonly name = "rules";

  async extract(input: ExtractionInput): Promise<ExtractedDraft> {
    const full = [input.body, input.attachmentText ?? ""].filter(Boolean).join("\n");
    const matchers = buildMatchers(input.catalog);
    const notes: string[] = [];

    const cnpj = CNPJ_RE.exec(full)?.[0] ?? null;

    const deadlineHit = parseDeadlineText(full, input.receivedAt);
    const items: DraftItem[] = [];
    let tableLines = 0;
    let unmatched = 0;
    let aggregatedConfidence = 0.9;

    for (const rawLine of full.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;

      const tableItem = parseTableLine(line);
      if (tableItem) {
        items.push(tableItem);
        tableLines++;
        continue;
      }
      if (/^[|\s-:]+$/.test(line)) continue;

      const normLine = normalize(line);
      if (NOISE_LINE_RE.test(normLine) && !SKU_RE.test(normLine)) continue;
      if (/[|\t]/.test(line)) continue; // cabeçalho de tabela

      for (const segment of splitSegments(line)) {
        const code = SKU_RE.exec(segment);
        if (code) {
          const rest = segment.replace(code[0], " ");
          items.push({
            sku: code[1].toUpperCase(),
            description: segment.trim(),
            quantity: pickQuantity(normalize(rest)),
            raw: segment.trim(),
          });
          continue;
        }
        const hit = matchCatalog(segment, matchers);
        if (hit) {
          items.push({ sku: hit.sku, description: segment.trim(), quantity: pickQuantity(hit.rest), raw: segment.trim() });
          continue;
        }
        const qFirst = ITEM_LIKE_QTY_FIRST.exec(segment);
        const qLast = qFirst ? null : ITEM_LIKE_QTY_LAST.exec(segment);
        if (qFirst || qLast) {
          unmatched++;
          items.push({
            sku: null,
            description: (qFirst ? qFirst[2] : qLast![1]).trim(),
            quantity: Number(qFirst ? qFirst[1] : qLast![2]),
            raw: segment.trim(),
          });
        }
      }
    }

    const approx = APPROX_RE.test(normalize(full));
    const vague = VAGUE_RE.test(normalize(full));

    if (approx) {
      aggregatedConfidence = Math.min(aggregatedConfidence, 0.6);
      notes.push("Quantidade aproximada no texto (ex.: 'uns 10').");
    }
    if (vague) {
      aggregatedConfidence = Math.min(aggregatedConfidence, 0.4);
      notes.push("O texto remete a um pedido anterior ('de sempre', 'igual ao da semana passada').");
    }
    if (items.length === 0) {
      aggregatedConfidence = Math.min(aggregatedConfidence, 0.3);
      notes.push("Nenhum item reconhecido no texto.");
    }
    if (unmatched > 0) notes.push(`${unmatched} linha(s) parecem itens, mas não foram associadas a nenhum produto.`);
    if (items.some((i) => i.quantity === null)) {
      aggregatedConfidence = Math.min(aggregatedConfidence, 0.55);
      notes.push("Há item sem quantidade identificada.");
    }

    const format: ExtractedDraft["format"] = input.attachmentText
      ? "pdf"
      : tableLines > 0 && tableLines >= items.length / 2
        ? "table"
        : "text";
    if (format === "table" && !approx && !vague && items.every((i) => i.quantity !== null)) aggregatedConfidence = 0.95;

    return {
      customerCnpj: cnpj,
      items,
      deadline: deadlineHit?.iso ?? null,
      deadlineText: deadlineHit?.text ?? null,
      confidence: Math.round(aggregatedConfidence * 100) / 100,
      format,
      notes,
    };
  }
}
