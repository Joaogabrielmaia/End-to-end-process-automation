import { z } from "zod";

/** Ordem = prioridade do motivo principal (ver docs/02-definicao/02-regras-de-negocio.md). */
export const EXCEPTION_CODES = [
  "CUSTOMER_NOT_FOUND",
  "EMPTY_ORDER",
  "UNKNOWN_SKU",
  "INVALID_QUANTITY",
  "OUT_OF_STOCK",
  "CREDIT_LIMIT_EXCEEDED",
  "HIGH_VALUE_APPROVAL",
  "INVALID_DEADLINE",
  "LOW_CONFIDENCE",
  "PROCESSING_FAILED",
] as const;
export type ExceptionCode = (typeof EXCEPTION_CODES)[number];

export const EXCEPTION_LABELS: Record<ExceptionCode, string> = {
  CUSTOMER_NOT_FOUND: "Cliente não encontrado",
  EMPTY_ORDER: "Nenhum item identificado",
  UNKNOWN_SKU: "Item não reconhecido",
  INVALID_QUANTITY: "Quantidade inválida",
  OUT_OF_STOCK: "Item sem estoque",
  CREDIT_LIMIT_EXCEEDED: "Limite de crédito excedido",
  HIGH_VALUE_APPROVAL: "Valor acima da alçada",
  INVALID_DEADLINE: "Prazo inválido",
  LOW_CONFIDENCE: "Extração com baixa confiança",
  PROCESSING_FAILED: "Falha no processamento",
};

export const MIN_CONFIDENCE = 0.7;
export const MAX_LINE_QUANTITY = 5000;
export const HIGH_VALUE_LIMIT = 15000;
export const DEFAULT_DEADLINE_BUSINESS_DAYS = 2;

export const draftItemSchema = z.object({
  sku: z.string().nullable(),
  description: z.string(),
  quantity: z.number().nullable(),
  raw: z.string().default(""),
});

export const draftSchema = z.object({
  customerCnpj: z.string().nullable(),
  items: z.array(draftItemSchema),
  /** Data ISO (AAAA-MM-DD) ou nulo quando o cliente não informou. */
  deadline: z.string().nullable(),
  deadlineText: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  format: z.enum(["text", "table", "pdf"]),
  notes: z.array(z.string()),
});
export type ExtractedDraft = z.infer<typeof draftSchema>;
export type DraftItem = z.infer<typeof draftItemSchema>;

export const inboundSchema = z.object({
  messageId: z.string().min(1).max(300).optional(),
  from: z.string().email(),
  subject: z.string().max(300).default(""),
  body: z.string().max(100_000).default(""),
  receivedAt: z.string().datetime().optional(),
  attachment: z
    .object({ filename: z.string().max(200), contentBase64: z.string().max(5_000_000) })
    .optional(),
});
export type InboundPayload = z.infer<typeof inboundSchema>;

export const approvalsSchema = z.object({
  credit: z.object({ reason: z.string(), by: z.string(), at: z.string() }).optional(),
  highValue: z.object({ reason: z.string(), by: z.string(), at: z.string() }).optional(),
});
export type Approvals = z.infer<typeof approvalsSchema>;

export const correctionSchema = z.object({
  customerCnpj: z.string().nullable().optional(),
  items: z.array(z.object({ sku: z.string().min(1).max(30), quantity: z.number().finite().max(1_000_000) })).optional(),
  deadline: z.string().nullable().optional(),
  approvals: z
    .object({
      credit: z.string().min(5, "Informe a justificativa (mínimo 5 caracteres)").optional(),
      highValue: z.string().min(5, "Informe a justificativa (mínimo 5 caracteres)").optional(),
    })
    .optional(),
  /** Reexecuta a extração a partir da mensagem original (usado em PROCESSING_FAILED). */
  reextract: z.boolean().optional(),
  actor: z.string().min(1).max(80).default("operador"),
});
export type Correction = z.infer<typeof correctionSchema>;

export interface Issue {
  code: ExceptionCode;
  detail: string;
  sku?: string;
}

export interface CustomerSnapshot {
  id: string;
  cnpj: string;
  name: string;
  email: string;
  creditLimit: number;
  creditUsed: number;
  active: boolean;
}

export interface ProductSnapshot {
  sku: string;
  name: string;
  aliases: string[];
  price: number;
  stock: number;
  active: boolean;
}
