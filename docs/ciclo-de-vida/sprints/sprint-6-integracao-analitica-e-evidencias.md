# Sprint 6 · Integração analítica e evidências

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Anterior: [Sprint 5](sprint-5-concorrencia-e-carga.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Janela de planejamento: 19–23/10/2026.

## Objetivo da sprint

Entregar os dados para análise em BI e fechar as evidências de teste, medição e documentação.

## Escopo

| Histórias | Requisitos |
|---|---|
| HU-13 | RF-15, RF-12, RNF-07 |

## Entregáveis

- Exportação de seis CSVs por `GET /api/export/<nome>.csv` (`src/lib/export.ts`): `orders`, `order_items`, `exceptions`, `audit_events`, `customers`, `products`.
- Documento com colunas, relacionamentos sugeridos e limites ([Power BI](../../06-pos-lancamento/power-bi.md)).
- Tela de medição, resultados de testes, README e índice.

## Critério de conclusão

O endpoint devolve cabeçalho e linhas (teste E2E); a documentação declara que não existe relatório de Power BI.

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `2f2ef7b` | 23/10/2026 | `src/lib/export.ts` e a rota de exportação |
| `dfb83b4` | 23/10/2026 | `power-bi.md` e resultados de testes |
| `7415a84` | 23/10/2026 | README e relatório de medição |

## Planning

Meta: dar a quem analisa os dados o mesmo vocabulário do sistema (códigos de exceção, tempos) e dizer o que o dado permite medir.

## Review

CSVs documentados e testados no endpoint; nenhum deles foi aberto no Power BI.

## Retrospectiva

- **Funcionou:** separar a medição do sistema da estimativa de ganho no relatório evitou misturar fato com hipótese.
- **Não funcionou:** sem relatório de Power BI, o caminho entre o CSV e a decisão de negócio fica por demonstrar.
- **Ação:** manter o item no [roadmap](../09-evolucao-e-roadmap.md) como "relatório de Power BI sobre os CSVs".
