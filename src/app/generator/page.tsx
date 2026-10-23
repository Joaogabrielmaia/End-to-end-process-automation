import { SCENARIO_EXPECTED, SCENARIO_WEIGHTS, type Scenario } from "@/lib/generator";
import { EXCEPTION_LABELS } from "@/lib/types";
import GeneratorForm from "./GeneratorForm";

const SCENARIO_LABELS: Record<Scenario, string> = {
  "clean-table": "Pedido em tabela (SKU | descrição | qtd)",
  "clean-text": "Pedido em texto livre",
  "clean-pdf": "Pedido em PDF simples anexado",
  "unknown-sku": "Contém um SKU inexistente",
  "unknown-customer": "CNPJ/remetente não cadastrado",
  "over-credit": "Cliente com crédito curto",
  "out-of-stock": "Item com estoque baixo",
  vague: "Texto vago (\"o de sempre\")",
  approximate: "Quantidade aproximada (\"uns 10\")",
  "high-value": "Acima da alçada (R$ 15.000)",
  "past-deadline": "Prazo no passado",
  resend: "Reenvio de um e-mail anterior",
};

export default function GeneratorPage() {
  const labels: Record<string, string> = { REGISTERED: "registrados", DUPLICATE: "reenvios ignorados", ...EXCEPTION_LABELS };
  const total = Object.values(SCENARIO_WEIGHTS).reduce((a, b) => a + b, 0);

  return (
    <>
      <h1>Gerador de pedidos de exemplo</h1>
      <p className="sub">
        Simula a caixa de e-mail: cria mensagens em formatos variados, inclusive com erros de propósito, e as envia pelo mesmo pipeline do
        endpoint <code>/api/inbound</code>.
      </p>

      <section className="card">
        <GeneratorForm labels={labels} />
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>Mistura de cenários (pesos escolhidos por mim)</h2>
        <p className="small muted">
          A taxa de revisão que aparece no painel depois de usar o gerador é consequência desta mistura. Não é uma previsão do mundo real.
        </p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cenário</th><th>Resultado esperado</th><th className="num">Peso</th></tr></thead>
            <tbody>
              {(Object.keys(SCENARIO_WEIGHTS) as Scenario[]).map((s) => {
                const exp = s === "resend" ? "DUPLICATE" : SCENARIO_EXPECTED[s];
                return (
                  <tr key={s}>
                    <td>{SCENARIO_LABELS[s]}</td>
                    <td>{labels[exp] ?? exp}</td>
                    <td className="num">{((SCENARIO_WEIGHTS[s] / total) * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
