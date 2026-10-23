import Link from "next/link";
import { notFound } from "next/navigation";
import { ReasonChip, StatusBadge } from "@/components/ui";
import { orderCode, prisma } from "@/lib/db";
import { brl, dateOnly, dateTime, duration } from "@/lib/format";
import { draftSchema, type ExceptionCode } from "@/lib/types";
import CorrectionForm from "./CorrectionForm";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: true, exception: true, message: true, events: { orderBy: { at: "asc" } } },
  });
  if (!order) notFound();

  // Eventos de antes da criação do pedido (recebimento/extração) ficam ligados à mensagem.
  const earlier = await prisma.auditEvent.findMany({ where: { inboundMessageId: order.messageId, orderId: null }, orderBy: { at: "asc" } });
  const events = [...earlier, ...order.events].sort((a, b) => a.at.getTime() - b.at.getTime());

  const draft = draftSchema.parse(order.draft);
  const issues = (order.exception?.issues ?? []) as { code: ExceptionCode; detail: string; sku?: string }[];
  const open = order.exception?.status === "OPEN";
  const codes = new Set(issues.map((i) => i.code));
  const latency = order.registeredAt ? order.registeredAt.getTime() - order.receivedAt.getTime() : null;

  return (
    <>
      <p className="small"><Link href="/orders">← Pedidos</Link></p>
      <h1 data-testid="order-title">{orderCode(order.number)}</h1>
      <p className="sub">
        <StatusBadge status={order.status} /> · {order.customer?.name ?? `remetente ${order.message.fromEmail} (cliente não identificado)`}
      </p>

      <section className="grid two">
        <div className="card">
          <h2>Resumo</h2>
          <table>
            <tbody>
              <tr><th>Recebido em</th><td>{dateTime(order.receivedAt)}</td></tr>
              <tr><th>Registrado em</th><td>{order.registeredAt ? dateTime(order.registeredAt) : "—"}</td></tr>
              <tr><th>Entrada → registro</th><td>{duration(latency)}</td></tr>
              <tr><th>Valor</th><td>{brl(order.total)}</td></tr>
              <tr><th>Prazo</th><td>{order.deadline ? dateOnly(order.deadline) : "—"}{order.deadlineAssumed ? " (assumido: 2 dias úteis)" : ""}</td></tr>
              <tr><th>Extração</th><td>{order.provider} · confiança {order.confidence.toFixed(2)} · formato {draft.format}</td></tr>
              <tr><th>Passou pela fila?</th><td>{order.reviewed ? "Sim" : "Não"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Itens</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Descrição</th><th className="num">Qtd</th><th className="num">Total</th></tr></thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr><td colSpan={4} className="muted">Nenhum item identificado.</td></tr>
                ) : (
                  order.items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.sku ?? <span className="badge bad">sem SKU</span>}</td>
                      <td>{i.description}</td>
                      <td className="num">{i.quantity ?? "—"}</td>
                      <td className="num">{i.lineTotal ? brl(i.lineTotal) : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {order.exception ? (
        <section className="card" style={{ marginTop: 14 }}>
          <h2>Exceção {open ? "aberta" : "resolvida"}</h2>
          {issues.length > 0 ? (
            <ul>
              {issues.map((i, idx) => (
                <li key={idx}><ReasonChip code={i.code} /> {i.detail}</li>
              ))}
            </ul>
          ) : null}
          {!open && order.exception.resolution ? <div className="notice ok">{order.exception.resolution}</div> : null}
          {open ? (
            <CorrectionForm
              orderId={order.id}
              needsCredit={codes.has("CREDIT_LIMIT_EXCEEDED")}
              needsHighValue={codes.has("HIGH_VALUE_APPROVAL")}
              failed={codes.has("PROCESSING_FAILED")}
              initial={{
                cnpj: draft.customerCnpj ?? "",
                deadline: order.deadline ? order.deadline.toISOString().slice(0, 10) : (draft.deadline ?? ""),
                rows: draft.items.map((i) => ({ sku: i.sku ?? "", quantity: i.quantity === null ? "" : String(i.quantity) })),
              }}
            />
          ) : null}
        </section>
      ) : null}

      <section className="grid two" style={{ marginTop: 14 }}>
        <div className="card">
          <h2>Trilha de auditoria</h2>
          <ol className="timeline" data-testid="audit-trail">
            {events.map((e) => (
              <li key={e.id} className={e.actor === "USER" ? "user" : ""}>
                <div>{e.message}</div>
                <div className="meta">
                  {dateTime(e.at)} · {e.actor === "USER" ? `pessoa: ${e.actorName}` : "automação"} · {e.type}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h2>Mensagem original</h2>
          <p className="small muted">
            De: {order.message.fromEmail}<br />Assunto: {order.message.subject}
            {order.message.attachmentName ? <><br />Anexo: {order.message.attachmentName}</> : null}
            {order.message.duplicateCount > 0 ? <><br />Reenvios ignorados: {order.message.duplicateCount}</> : null}
          </p>
          <pre className="msg">{order.message.body}</pre>
        </div>
      </section>
    </>
  );
}
