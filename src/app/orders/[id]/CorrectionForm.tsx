"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Row {
  sku: string;
  quantity: string;
}

interface Props {
  orderId: string;
  initial: { cnpj: string; deadline: string; rows: Row[] };
  needsCredit: boolean;
  needsHighValue: boolean;
  failed: boolean;
}

export default function CorrectionForm({ orderId, initial, needsCredit, needsHighValue, failed }: Props) {
  const router = useRouter();
  const [cnpj, setCnpj] = useState(initial.cnpj);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [rows, setRows] = useState<Row[]>(initial.rows.length ? initial.rows : [{ sku: "", quantity: "" }]);
  const [credit, setCredit] = useState("");
  const [highValue, setHighValue] = useState("");
  const [actor, setActor] = useState("Ricardo (simulado)");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad" | "warn"; text: string } | null>(null);

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/reprocess`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, actor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tone: "bad", text: data.issues?.map((i: { message: string }) => i.message).join(" ") ?? data.error ?? "Erro" });
      } else if (data.status === "registered") {
        setMsg({ tone: "ok", text: `Pedido ${data.orderCode} registrado.` });
        router.refresh();
      } else {
        setMsg({ tone: "warn", text: "Continua na fila: a revalidação ainda encontrou pendências (veja os motivos acima)." });
        router.refresh();
      }
    } catch {
      setMsg({ tone: "bad", text: "Não consegui falar com o servidor." });
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const items = rows
      .filter((r) => r.sku.trim() !== "")
      .map((r) => ({ sku: r.sku.trim(), quantity: Number(r.quantity.replace(",", ".")) }));
    if (items.some((i) => Number.isNaN(i.quantity))) {
      setMsg({ tone: "bad", text: "Quantidade precisa ser um número." });
      return;
    }
    send({
      customerCnpj: cnpj.trim() || null,
      deadline: deadline || null,
      items,
      approvals: {
        ...(credit.trim() ? { credit: credit.trim() } : {}),
        ...(highValue.trim() ? { highValue: highValue.trim() } : {}),
      },
    });
  }

  return (
    <form onSubmit={submit} aria-label="Correção e reprocessamento">
      <div className="row">
        <div>
          <label htmlFor="cnpj">CNPJ do cliente</label>
          <input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.100.000/0001-01" />
        </div>
        <div>
          <label htmlFor="deadline">Prazo</label>
          <input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <label htmlFor="actor">Quem está corrigindo</label>
          <input id="actor" value={actor} onChange={(e) => setActor(e.target.value)} />
        </div>
      </div>

      <label>Itens</label>
      {rows.map((r, i) => (
        <div className="row" key={i} style={{ marginBottom: 6 }}>
          <input aria-label={`SKU do item ${i + 1}`} value={r.sku} placeholder="SKU (ex.: DJM-020)" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
          <input aria-label={`Quantidade do item ${i + 1}`} value={r.quantity} placeholder="Quantidade" inputMode="numeric" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
          <button type="button" className="secondary" style={{ flex: "0 0 auto" }} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remover item ${i + 1}`}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className="secondary" onClick={() => setRows([...rows, { sku: "", quantity: "" }])}>
        + Adicionar item
      </button>

      {needsCredit ? (
        <div>
          <label htmlFor="credit">Aprovar excesso de crédito (justificativa obrigatória; fica na auditoria)</label>
          <input id="credit" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="ex.: cliente antigo, liberado por telefone" />
        </div>
      ) : null}
      {needsHighValue ? (
        <div>
          <label htmlFor="highValue">Aprovar valor acima da alçada (justificativa obrigatória)</label>
          <input id="highValue" value={highValue} onChange={(e) => setHighValue(e.target.value)} placeholder="ex.: aprovado pela gerente comercial" />
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 14 }}>
        <button type="submit" disabled={busy}>Corrigir e reprocessar</button>
        {failed ? (
          <button type="button" className="secondary" disabled={busy} onClick={() => send({ reextract: true })}>
            Tentar novamente (reextrair da mensagem)
          </button>
        ) : (
          <button type="button" className="secondary" disabled={busy} onClick={() => send({})}>
            Reprocessar sem alterar
          </button>
        )}
      </div>
      {msg ? <div className={`notice ${msg.tone}`} role="status">{msg.text}</div> : null}
    </form>
  );
}
