import { prisma } from "./db";
import { EXCEPTION_CODES, type ExceptionCode } from "./types";

export interface DashboardMetrics {
  totalOrders: number;
  byStatus: { registered: number; exceptionOpen: number; exceptionResolved: number };
  /** Pedidos que passaram pela fila de exceções em algum momento ÷ total de pedidos. */
  reviewRate: number;
  reviewedOrders: number;
  /** Tempo entre a entrada da mensagem e o registro. */
  latencyMs: {
    allAvg: number | null;
    autoAvg: number | null;
    autoP50: number | null;
    autoP95: number | null;
    reviewedAvg: number | null;
  };
  reasons: { code: ExceptionCode; count: number }[];
  openExceptions: number;
  oldestOpenExceptionAt: Date | null;
  duplicatesIgnored: number;
  failedMessages: number;
  notifications: number;
}

type Row = { avg: number | null; p50: number | null; p95: number | null };

async function latency(reviewed: boolean | null): Promise<Row> {
  const filter = reviewed === null ? "" : `AND "reviewed" = ${reviewed ? "true" : "false"}`;
  const rows = await prisma.$queryRawUnsafe<Row[]>(`
    SELECT AVG(EXTRACT(EPOCH FROM ("registeredAt" - "receivedAt")) * 1000)::float AS avg,
           (percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("registeredAt" - "receivedAt")) * 1000))::float AS p50,
           (percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("registeredAt" - "receivedAt")) * 1000))::float AS p95
    FROM "Order" WHERE "status" = 'REGISTERED' AND "registeredAt" IS NOT NULL ${filter}`);
  return rows[0] ?? { avg: null, p50: null, p95: null };
}

export async function getDashboard(): Promise<DashboardMetrics> {
  const [totalOrders, registered, openExc, resolvedExc, reviewedOrders, all, auto, reviewed, cases, dup, failed, notifications, oldest] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "REGISTERED" } }),
      prisma.exceptionCase.count({ where: { status: "OPEN" } }),
      prisma.exceptionCase.count({ where: { status: "RESOLVED" } }),
      prisma.order.count({ where: { reviewed: true } }),
      latency(null),
      latency(false),
      latency(true),
      prisma.exceptionCase.findMany({ select: { issues: true } }),
      prisma.inboundMessage.aggregate({ _sum: { duplicateCount: true } }),
      prisma.inboundMessage.count({ where: { status: "FAILED" } }),
      prisma.notification.count(),
      prisma.exceptionCase.findFirst({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);

  const counts = new Map<ExceptionCode, number>();
  for (const c of cases) {
    for (const issue of c.issues as { code: ExceptionCode }[]) {
      counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
    }
  }
  const reasons = EXCEPTION_CODES.filter((c) => counts.has(c))
    .map((code) => ({ code, count: counts.get(code)! }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOrders,
    byStatus: { registered, exceptionOpen: openExc, exceptionResolved: resolvedExc },
    reviewRate: totalOrders ? reviewedOrders / totalOrders : 0,
    reviewedOrders,
    latencyMs: { allAvg: all.avg, autoAvg: auto.avg, autoP50: auto.p50, autoP95: auto.p95, reviewedAvg: reviewed.avg },
    reasons,
    openExceptions: openExc,
    oldestOpenExceptionAt: oldest?.createdAt ?? null,
    duplicatesIgnored: dup._sum.duplicateCount ?? 0,
    failedMessages: failed,
    notifications,
  };
}
