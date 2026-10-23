import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ReasonChip, StatusBadge } from "@/components/ui";
import { orderCode, prisma } from "@/lib/db";
import { brl, dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (status === "REGISTERED" || status === "EXCEPTION") where.status = status;
  if (q) where.OR = [{ customer: { name: { contains: q, mode: "insensitive" } } }, { message: { fromEmail: { contains: q, mode: "insensitive" } } }];

  const orders = await prisma.order.findMany({
    where,
    orderBy: { number: "desc" },
    take: 100,
    include: { customer: true, exception: true, message: true, _count: { select: { items: true } } },
  });

  return (
    <>
      <h1>Pedidos</h1>
      <p className="sub">Últimos 100 pedidos. Filtre por status ou por cliente/remetente.</p>

      <form className="card row" method="get" aria-label="Filtros">
        <div>
          <label htmlFor="q">Cliente ou remetente</label>
          <input id="q" name="q" defaultValue={q ?? ""} placeholder="ex.: Pinheiro" />
        </div>
        <div>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">Todos</option>
            <option value="REGISTERED">Registrados</option>
            <option value="EXCEPTION">Em exceção</option>
          </select>
        </div>
        <div>
          <button type="submit">Filtrar</button>
        </div>
      </form>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Status</th>
                <th className="num">Itens</th>
                <th className="num">Valor</th>
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="muted">Nenhum pedido encontrado.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/orders/${o.id}`}>{orderCode(o.number)}</Link></td>
                    <td>{o.customer?.name ?? <span className="muted">{o.message.fromEmail}</span>}</td>
                    <td>
                      <div className="chips">
                        <StatusBadge status={o.status} />
                        {o.exception?.status === "OPEN" ? <ReasonChip code={o.exception.primary} /> : null}
                      </div>
                    </td>
                    <td className="num">{o._count.items}</td>
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
