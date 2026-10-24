# 04 · Backlog em 3 sprints

Sprints são agrupamentos lógicos. O plano das seis sprints do cenário, com objetivos, critérios de conclusão, revisões e retrospectivas, está em [`../ciclo-de-vida/sprints`](../ciclo-de-vida/sprints/README.md); esses registros foram elaborados a partir das evidências do repositório, não existem atas contemporâneas, e o repositório não tem tag.

| Sprint | Meta | Histórias | Entrega verificável |
|---|---|---|---|
| **1** · Núcleo do pipeline | Pedido bem formatado entra, é validado e registrado, sem duplicar | HU-01, HU-02, HU-03, HU-04, HU-12 (seed) | Endpoint de entrada, extração por regras, validação, registro, idempotência, testes unitários |
| **2** · Exceções, notificação e painel | O que dá errado aparece e pode ser corrigido | HU-05, HU-06, HU-07, HU-08, HU-11 | Fila de exceções, correção e reprocessamento, aprovação, notificação, painel, gerador, fluxo n8n |
| **3** · Confiabilidade e evidências | Auditoria, retentativa, export e provas | HU-09, HU-10, HU-13 + medição | Trilha de auditoria, retentativa, CSV, testes de integração/E2E, carga |
| *Pós* · v1.1 | Alerta de exceções paradas | HU-14 | Planejado (v1.1); sem código nem teste |

## Critério de pronto de cada sprint
Código tipado, testes passando e documentação atualizada.

## Ordem dentro do Sprint 1 (dependências)
1. Modelo de dados e seed → 2. Extração → 3. Validação (função pura) → 4. Pipeline com idempotência → 5. Endpoint.
