import { prisma } from "./db";

type Cell = string | number | boolean | Date | null | undefined;

function cell(v: Cell): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: Cell[][]): string {
  // BOM para o Excel e o Power BI abrirem os acentos corretamente.
  return "﻿" + [headers.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n") + "\r\n";
}

const num = (d: { toString(): string } | null) => (d === null ? null : Number(d.toString()));

export const EXPORTS = ["orders", "order_items", "exceptions", "audit_events", "customers", "products"] as const;
export type ExportName = (typeof EXPORTS)[number];

/** Colunas documentadas em docs/06-pos-lancamento/power-bi.md. */
export async function buildCsv(name: ExportName): Promise<string> {
  switch (name) {
    case "orders": {
      const rows = await prisma.order.findMany({ include: { customer: true, exception: true }, orderBy: { number: "asc" } });
      return toCsv(
        ["order_number", "status", "customer_cnpj", "customer_name", "received_at", "registered_at", "latency_seconds", "total", "reviewed", "deadline", "deadline_assumed", "confidence", "provider", "primary_exception"],
        rows.map((o) => [
          o.number,
          o.status,
          o.customer?.cnpj,
          o.customer?.name,
          o.receivedAt,
          o.registeredAt,
          o.registeredAt ? (o.registeredAt.getTime() - o.receivedAt.getTime()) / 1000 : null,
          num(o.total),
          o.reviewed,
          o.deadline?.toISOString().slice(0, 10),
          o.deadlineAssumed,
          o.confidence,
          o.provider,
          o.exception?.primary,
        ]),
      );
    }
    case "order_items": {
      const rows = await prisma.orderItem.findMany({ include: { order: true }, orderBy: [{ order: { number: "asc" } }] });
      return toCsv(
        ["order_number", "sku", "description", "quantity", "unit_price", "line_total"],
        rows.map((i) => [i.order.number, i.sku, i.description, i.quantity, num(i.unitPrice), num(i.lineTotal)]),
      );
    }
    case "exceptions": {
      const rows = await prisma.exceptionCase.findMany({ include: { order: true }, orderBy: { createdAt: "asc" } });
      const out: Cell[][] = [];
      for (const e of rows) {
        for (const issue of e.issues as { code: string }[]) {
          out.push([
            e.order.number,
            e.status,
            issue.code,
            e.primary === issue.code,
            e.createdAt,
            e.resolvedAt,
            e.resolvedAt ? (e.resolvedAt.getTime() - e.createdAt.getTime()) / 1000 : null,
          ]);
        }
      }
      return toCsv(["order_number", "exception_status", "reason_code", "is_primary", "opened_at", "resolved_at", "seconds_to_resolve"], out);
    }
    case "audit_events": {
      const rows = await prisma.auditEvent.findMany({ include: { order: true }, orderBy: { at: "asc" } });
      return toCsv(
        ["at", "order_number", "actor", "actor_name", "type", "message"],
        rows.map((a) => [a.at, a.order?.number, a.actor, a.actorName, a.type, a.message]),
      );
    }
    case "customers": {
      const rows = await prisma.customer.findMany({ orderBy: { name: "asc" } });
      return toCsv(
        ["cnpj", "name", "email", "credit_limit", "credit_used", "active"],
        rows.map((c) => [c.cnpj, c.name, c.email, num(c.creditLimit), num(c.creditUsed), c.active]),
      );
    }
    case "products": {
      const rows = await prisma.product.findMany({ orderBy: { sku: "asc" } });
      return toCsv(
        ["sku", "name", "unit", "price", "stock", "active"],
        rows.map((p) => [p.sku, p.name, p.unit, num(p.price), p.stock, p.active]),
      );
    }
  }
}
