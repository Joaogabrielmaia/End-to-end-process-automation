"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Result {
  sent: number;
  outcomes: Record<string, number>;
  matchedExpectation: number;
}

export default function GeneratorForm({ labels }: { labels: Record<string, string> }) {
  const router = useRouter();
  const [count, setCount] = useState(20);
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count, ...(seed ? { seed: Number(seed) } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erro ao gerar");
      else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("Não consegui falar com o servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={run} aria-label="Gerar pedidos de exemplo">
      <div className="row">
        <div>
          <label htmlFor="count">Quantidade de e-mails (1 a 500)</label>
          <input id="count" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="seed">Semente (opcional, para repetir o mesmo lote)</label>
          <input id="seed" inputMode="numeric" value={seed} onChange={(e) => setSeed(e.target.value.replace(/\D/g, ""))} placeholder="ex.: 42" />
        </div>
        <div>
          <button type="submit" disabled={busy}>{busy ? "Processando…" : "Gerar e enviar ao pipeline"}</button>
        </div>
      </div>
      {error ? <div className="notice bad" role="alert">{error}</div> : null}
      {result ? (
        <div className="notice info" role="status" data-testid="generator-result">
          <strong>{result.sent} e-mails enviados.</strong> Resultado do pipeline:{" "}
          {Object.entries(result.outcomes)
            .map(([k, v]) => `${labels[k] ?? k}: ${v}`)
            .join(" · ")}
          . Concordância com o resultado esperado do gerador: {result.matchedExpectation} de {result.sent}.
        </div>
      ) : null}
    </form>
  );
}
