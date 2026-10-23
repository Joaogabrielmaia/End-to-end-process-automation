import fs from "node:fs";
import path from "node:path";
import { Kpi } from "@/components/ui";
import { brl, duration } from "@/lib/format";
import { DEFAULT_INPUTS, estimate } from "@/lib/estimate";
import { getDashboard } from "@/lib/metrics";

export const dynamic = "force-dynamic";

interface LoadResult {
  generatedAt: string;
  messages: number;
  seed: number;
  concurrency: number;
  elapsedMs: number;
  throughputPerSec: number;
  requestLatencyMs: { avg: number; p50: number; p95: number; max: number };
  outcomes: Record<string, number>;
  expectedAgreement: { matched: number; total: number };
  db: { reviewRate: number; autoAvgMs: number | null; autoP50Ms: number | null; autoP95Ms: number | null; reviewedOrders: number; totalOrders: number };
}

function readLoad(): LoadResult | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "docs", "04-processo", "medicao-resultados.json"), "utf8"));
  } catch {
    return null;
  }
}

const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")}%`;

export default async function MeasurementPage() {
  const load = readLoad();
  const live = await getDashboard();
  const i = DEFAULT_INPUTS;
  const scenarios = [0.1, 0.2, 0.35].map((rate) => ({ rate, ...estimate(rate) }));

  return (
    <>
      <h1>Relatório de medição</h1>
      <p className="sub">
        Duas coisas diferentes, sem misturar: <strong>(1) medição do sistema</strong> com dados de exemplo e <strong>(2) estimativa de ganho</strong>,
        que é uma hipótese com entradas declaradas. Documento completo: <code>docs/04-processo/relatorio-de-medicao.md</code>.
      </p>

      <h2>1 · Medição do sistema (teste de carga com dados de exemplo)</h2>
      {load ? (
        <>
          <section className="grid cards" aria-label="Resultados do teste de carga">
            <Kpi id="m-msgs" label="E-mails enviados" value={String(load.messages)} hint={`semente ${load.seed}, concorrência ${load.concurrency}`} />
            <Kpi id="m-elapsed" label="Tempo total" value={duration(load.elapsedMs)} hint={`${load.throughputPerSec.toFixed(1).replace(".", ",")} e-mails/s`} />
            <Kpi id="m-p50" label="Latência da requisição (mediana)" value={duration(load.requestLatencyMs.p50)} hint={`p95 ${duration(load.requestLatencyMs.p95)} · máx ${duration(load.requestLatencyMs.max)}`} />
            <Kpi id="m-agree" label="Decisões iguais ao esperado" value={`${load.expectedAgreement.matched}/${load.expectedAgreement.total}`} hint="rótulo do gerador × decisão do pipeline" />
            <Kpi id="m-review" label="Taxa de revisão no lote" value={pct(load.db.reviewRate)} hint="consequência da mistura do gerador, não previsão" />
          </section>
          <section className="card" style={{ marginTop: 14 }}>
            <h2>Resultado por desfecho</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Desfecho</th><th className="num">Quantidade</th></tr></thead>
                <tbody>
                  {Object.entries(load.outcomes).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td className="num">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Gerado em {new Date(load.generatedAt).toLocaleString("pt-BR")} na minha máquina, com Postgres local em Docker. Não é benchmark de produção.</p>
          </section>
        </>
      ) : (
        <div className="notice warn">Ainda não há resultado de carga. Rode <code>npm run load</code>.</div>
      )}

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Estado atual do banco</h2>
        <p className="small muted">
          Pedidos: {live.totalOrders} · revisão {pct(live.reviewRate)} · entrada→registro sem revisão {duration(live.latencyMs.autoAvg)}
        </p>
      </section>

      <h2 style={{ marginTop: 24 }}>2 · Estimativa de ganho (hipótese declarada)</h2>
      <section className="card">
        <p>
          <code>horas liberadas por mês = volume mensal × (minutos manuais − taxa de revisão × minutos por exceção) ÷ 60</code>
          <br />
          <code>valor estimado por mês = horas liberadas × custo da hora</code>
        </p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Entrada</th><th className="num">Valor</th><th>Origem</th></tr></thead>
            <tbody>
              <tr><td>Pedidos por dia</td><td className="num">{i.ordersPerDay}</td><td>Briefing do caso</td></tr>
              <tr><td>Dias úteis por mês</td><td className="num">{i.businessDaysPerMonth}</td><td>Premissa minha</td></tr>
              <tr><td>Minutos manuais por pedido</td><td className="num">{i.manualMinutesPerOrder}</td><td>Estimativa do entrevistado (simulado)</td></tr>
              <tr><td>Minutos por exceção</td><td className="num">{i.minutesPerException}</td><td>Premissa minha</td></tr>
              <tr><td>Custo da hora</td><td className="num">{brl(i.hourlyCost)}</td><td>Premissa minha</td></tr>
            </tbody>
          </table>
        </div>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Cenário de taxa de revisão</th><th className="num">Min. residuais/pedido</th><th className="num">Horas liberadas/mês</th><th className="num">Valor estimado/mês</th></tr></thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.rate}>
                  <td>{pct(s.rate)}{s.rate === 0.2 ? " (base)" : ""}</td>
                  <td className="num">{s.residualMinutesPerOrder.toString().replace(".", ",")}</td>
                  <td className="num">{s.hoursFreed.toString().replace(".", ",")} h</td>
                  <td className="num">{brl(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">São horas liberadas, não corte de custo. Não inclui implantação, manutenção nem a hora de quem aprova exceções.</p>
      </section>
    </>
  );
}
