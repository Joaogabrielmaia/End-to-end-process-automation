import Link from "next/link";
import { Bars, Kpi, ReasonChip, StatusBadge } from "@/components/ui";
import { orderCode, prisma } from "@/lib/db";
import { brl, dateTime, duration } from "@/lib/format";
import { getDashboard } from "@/lib/metrics";
import { EXCEPTION_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await getDashboard();
  const recent = await prisma.order.findMany({
    orderBy: { number: "desc" },
    take: 8,
    include: { customer: true, exception: true, message: true },
  });
  const oldestAge = m.oldestOpenExceptionAt ? Date.now() - m.oldestOpenExceptionAt.getTime() : null;

  return (
    <>
      <h1>Painel</h1>
      <p className="sub">Pedidos recebidos por e-mail, processados pelo Fluxo. Dados de exemplo (estudo de caso fictício).</p>

      <section className="grid cards" aria-label="Indicadores">
        <Kpi id="kpi-total" label="Pedidos processados" value={String(m.totalOrders)} hint={`${m.duplicatesIgnored} reenvio(s) ignorado(s)`} />
        <Kpi id="kpi-registered" label="Registrados" value={String(m.byStatus.registered)} />
        <Kpi id="kpi-open" label="Na fila de exceções" value={String(m.byStatus.exceptionOpen)} hint={oldestAge !== null ? `mais antiga há ${duration(oldestAge)}` : "fila vazia"} />
        <Kpi id="kpi-review" label="Taxa de revisão" value={`${(m.reviewRate * 100).toFixed(1).replace(".", ",")}%`} hint={`${m.reviewedOrders} de ${m.totalOrders} passaram pela fila`} />
        <Kpi id="kpi-latency" label="Entrada → registro (sem revisão)" value={duration(m.latencyMs.autoAvg)} hint={`mediana ${duration(m.latencyMs.autoP50)} · p95 ${duration(m.latencyMs.autoP95)}`} />
        <Kpi id="kpi-latency-reviewed" label="Entrada → registro (com revisão)" value={duration(m.latencyMs.reviewedAvg)} hint="inclui o tempo de espera por uma pessoa" />
      </section>

      <section className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <h2>Pedidos por status</h2>
          <Bars
            rows={[
              { label: "Registrados", value: m.byStatus.registered },
              { label: "Exceção aberta", value: m.byStatus.exceptionOpen },
              { label: "Exceção resolvida", value: m.byStatus.exceptionResolved },
            ]}
          />
        </div>
        <div className="card">
          <h2>Motivos de exceção</h2>
          <Bars tone="warn" rows={m.reasons.map((r) => ({ label: EXCEPTION_LABELS[r.code], value: r.count }))} />
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Últimos pedidos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Status</th>
                <th className="num">Valor</th>
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="muted">Nenhum pedido ainda. Use o <Link href="/generator">gerador</Link>.</td></tr>
              ) : (
                recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/orders/${o.id}`}>{orderCode(o.number)}</Link></td>
                    <td>{o.customer?.name ?? <span className="muted">{o.message.fromEmail}</span>}</td>
                    <td>
                      <div className="chips">
                        <StatusBadge status={o.status} />
                        {o.exception?.status === "OPEN" ? <ReasonChip code={o.exception.primary} /> : null}
                      </div>
                    </td>
                    <td className="num">{brl(o.total)}</td>
                    <td>{dateTime(o.receivedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
