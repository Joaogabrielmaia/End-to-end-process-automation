import type { Prisma, PrismaClient } from "@prisma/client";

type Client = PrismaClient | Prisma.TransactionClient;

export type AuditType =
  | "MESSAGE_RECEIVED"
  | "DUPLICATE_IGNORED"
  | "EXTRACTED"
  | "DEADLINE_ASSUMED"
  | "VALIDATED"
  | "ORDER_REGISTERED"
  | "EXCEPTION_OPENED"
  | "EXCEPTION_UPDATED"
  | "EXCEPTION_RESOLVED"
  | "RETRY_SCHEDULED"
  | "PROCESSING_FAILED"
  | "CORRECTION_APPLIED"
  | "APPROVAL_GRANTED"
  | "RACE_DETECTED"
  | "NOTIFIED"
  | "NOTIFY_FAILED"
  | "STALLED_ALERT";

export interface AuditInput {
  type: AuditType;
  message: string;
  actor?: "AUTOMATION" | "USER";
  actorName?: string;
  data?: Prisma.InputJsonValue;
  orderId?: string | null;
  inboundMessageId?: string | null;
}

/** Trilha append-only (ADR-006): só insere; nunca atualiza nem apaga eventos. */
export async function audit(client: Client, e: AuditInput): Promise<void> {
  await client.auditEvent.create({
    data: {
      type: e.type,
      message: e.message,
      actor: e.actor ?? "AUTOMATION",
      actorName: e.actorName ?? (e.actor === "USER" ? "operador" : "fluxo"),
      data: e.data,
      orderId: e.orderId ?? undefined,
      inboundMessageId: e.inboundMessageId ?? undefined,
    },
  });
}
