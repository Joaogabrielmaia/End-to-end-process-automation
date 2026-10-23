import Link from "next/link";
import { prisma } from "@/lib/db";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const items = await prisma.notification.findMany({ orderBy: { at: "desc" }, take: 50 });
  return (
    <>
      <h1>Notificações (canal simulado)</h1>
      <p className="sub">
        O que a equipe receberia no canal de mensagens. É um canal <strong>simulado</strong>: grava em tabela, sem entrega real (ADR-007).
      </p>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Quando</th><th>Canal</th><th>Assunto</th><th>Mensagem</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="muted">Nenhuma notificação ainda.</td></tr>
              ) : (
                items.map((n) => (
                  <tr key={n.id}>
                    <td>{dateTime(n.at)}</td>
                    <td>{n.recipient}</td>
                    <td>{n.orderId ? <Link href={`/orders/${n.orderId}`}>{n.subject}</Link> : n.subject}</td>
                    <td>{n.body}</td>
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
