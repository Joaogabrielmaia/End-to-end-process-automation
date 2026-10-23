import { draftSchema, type ExtractedDraft } from "../types";
import type { ExtractionInput, ExtractionProvider } from "./provider";
import { TransientError } from "../retry";

type FetchLike = typeof fetch;

/**
 * Alternativa por LLM para texto livre (ADR-004). Só é usada quando EXTRACTION_PROVIDER=rules+llm
 * e há chave. NOTA DE HONESTIDADE: este provedor é testado com `fetch` simulado; não foi executado
 * contra a API real neste estudo.
 */
export class LlmExtractionProvider implements ExtractionProvider {
  readonly name = "llm";

  constructor(
    private readonly apiKey: string,
    private readonly model = "claude-haiku-5-5",
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async extract(input: ExtractionInput): Promise<ExtractedDraft> {
    const catalog = input.catalog.map((c) => `${c.sku}: ${c.name}`).join("\n");
    const prompt = [
      "Extraia o pedido do e-mail abaixo. Responda SOMENTE com JSON no formato:",
      '{"customerCnpj": string|null, "items": [{"sku": string|null, "description": string, "quantity": number|null, "raw": string}],',
      ' "deadline": "AAAA-MM-DD"|null, "deadlineText": string|null, "confidence": número de 0 a 1, "format": "text", "notes": string[]}',
      "Use apenas SKUs do catálogo; se não tiver certeza do SKU, use null. Se estiver em dúvida, baixe a confiança.",
      `Data de recebimento: ${input.receivedAt.toISOString().slice(0, 10)}`,
      `Catálogo:\n${catalog}`,
      `Assunto: ${input.subject}\nCorpo:\n${input.body}`,
    ].join("\n");

    const res = await this.fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: this.model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
    });
    if (res.status === 429 || res.status >= 500) throw new TransientError(`LLM indisponível (${res.status})`);
    if (!res.ok) throw new Error(`LLM respondeu ${res.status}`);

    const payload = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = payload.content?.find((c) => c.type === "text")?.text ?? "";
    const json = /\{[\s\S]*\}/.exec(text)?.[0];
    if (!json) throw new Error("Resposta do LLM sem JSON");
    return draftSchema.parse(JSON.parse(json));
  }
}

/**
 * Regras primeiro; o LLM só entra quando a confiança das regras fica abaixo do limiar.
 * Se o LLM falhar ou responder com menos confiança, vale o resultado das regras.
 */
export class FallbackExtractionProvider implements ExtractionProvider {
  readonly name: string;

  constructor(
    private readonly primary: ExtractionProvider,
    private readonly secondary: ExtractionProvider,
    private readonly threshold = 0.7,
  ) {
    this.name = `${primary.name}+${secondary.name}`;
  }

  async extract(input: ExtractionInput): Promise<ExtractedDraft> {
    const first = await this.primary.extract(input);
    if (first.confidence >= this.threshold) return first;
    try {
      const second = await this.secondary.extract(input);
      return second.confidence > first.confidence
        ? { ...second, notes: [...second.notes, `Complementado por ${this.secondary.name}.`] }
        : first;
    } catch {
      return { ...first, notes: [...first.notes, `${this.secondary.name} indisponível; mantido o resultado das regras.`] };
    }
  }
}
