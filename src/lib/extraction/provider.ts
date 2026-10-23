import type { ExtractedDraft } from "../types";

export interface CatalogEntry {
  sku: string;
  name: string;
  aliases: string[];
}

export interface ExtractionInput {
  messageId: string;
  fromEmail: string;
  subject: string;
  body: string;
  /** Texto já extraído do anexo PDF, quando houver. */
  attachmentText?: string;
  receivedAt: Date;
  catalog: CatalogEntry[];
}

/**
 * Contrato único para qualquer forma de extrair um rascunho de pedido (ADR-004).
 * A saída sempre passa pela mesma validação, venha de regra, de LLM ou de fixture.
 */
export interface ExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractedDraft>;
}
