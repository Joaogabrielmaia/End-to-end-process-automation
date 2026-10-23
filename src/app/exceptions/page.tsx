import Link from "next/link";
import { ReasonChip } from "@/components/ui";
import { orderCode, prisma } from "@/lib/db";
import { brl, dateTime, duration } from "@/lib/format";
import type { ExceptionCode } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExceptionsPage() {
  const open = await prisma.exceptionCase.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: { order: { include: { customer: true, message: true } } },
  });
  const resolved = await prisma.exceptionCase.findMany({
    where: { status: "RESOLVED" },
    orderBy: { resolvedAt: "desc" },
    take: 8,
    include: { order: { include: { customer: true, message: true } } },
  });
  const now = Date.now();

  return (
    <>
      <h1>Fila de exceções</h1>
      <p className="sub">
        Pedidos que a automação não quis decidir sozinha. Do mais antigo para o mais novo. Abra um item para corrigir e reprocessar.
      </p>

      <section className="card">
        <h2 data-testid="open-count">Abertas ({open.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente / remetente</th>
                <th>Motivos</th>
                <th className="num">Valor</th>
                <th>Parada há</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {open.length === 0 ? (
                <tr><td colSpan={6} className="muted">Fila vazia.</td></tr>
              ) : (
                open.map((e) => (
                  <tr key={e.id}>
                    <td>{orderCode(e.order.number)}</td>
                    <td>{e.order.customer?.name ?? <span className="muted">{e.order.message.fromEmail}</span>}</td>
                    <td>
                      <div className="chips">
                        {(e.issues as { code: ExceptionCode }[])
                          .map((i) => i.code)
                          .filter((c, idx, arr) => arr.indexOf(c) === idx)
                          .map((c) => <ReasonChip key={c} code={c} />)}
                      </div>
                    </td>
                    <td className="num">{brl(e.order.total)}</td>
                    <td>{duration(now - e.createdAt.getTime())}</td>
                    <td><Link className="btn secondary" href={`/orders/${e.orderId}`}>Corrigir</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Resolvidas recentemente</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Motivo original</th><th>Resolvida em</th><th>Como</th></tr>
            </thead>
            <tbody>
              {resolved.length === 0 ? (
                <tr><td colSpan={5} className="muted">Nenhuma ainda.</td></tr>
              ) : (
                resolved.map((e) => (
                  <tr key={e.id}>
                    <td><Link href={`/orders/${e.orderId}`}>{orderCode(e.order.number)}</Link></td>
                    <td>{e.order.customer?.name ?? e.order.message.fromEmail}</td>
                    <td><ReasonChip code={e.primary} /></td>
                    <td>{e.resolvedAt ? dateTime(e.resolvedAt) : "—"}</td>
                    <td className="small muted">{e.resolution}</td>
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
