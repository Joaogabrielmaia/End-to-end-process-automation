import type { ExtractedDraft } from "../types";
import type { ExtractionInput, ExtractionProvider } from "./provider";

/**
 * Provedor determinístico para testes: devolve um rascunho pré-definido por messageId
 * (ou o rascunho padrão). Permite testar validação e pipeline sem depender de texto.
 */
export class FixtureExtractionProvider implements ExtractionProvider {
  readonly name = "fixture";

  constructor(
    private readonly byMessageId: Record<string, ExtractedDraft> = {},
    private readonly fallback?: ExtractedDraft,
  ) {}

  async extract(input: ExtractionInput): Promise<ExtractedDraft> {
    const hit = this.byMessageId[input.messageId] ?? this.fallback;
    if (!hit) throw new Error(`Sem fixture para a mensagem ${input.messageId}`);
    return structuredClone(hit);
  }
}
