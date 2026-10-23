# 04 · Backlog em 3 sprints

Sprints lógicos (sem calendário real de equipe). Cada sprint termina com um `sprint-N-review.md` em [`../04-processo`](../04-processo/).

| Sprint | Meta | Histórias | Entrega verificável |
|---|---|---|---|
| **1** · Núcleo do pipeline | Pedido bem formatado entra, é validado e registrado, sem duplicar | HU-01, HU-02, HU-03, HU-04, HU-12 (seed) | Endpoint de entrada, extração por regras, validação, registro, idempotência, testes unitários |
| **2** · Exceções, notificação e painel | O que dá errado aparece e pode ser corrigido | HU-05, HU-06, HU-07, HU-08, HU-11 | Fila de exceções, correção e reprocessamento, aprovação, notificação, painel, gerador, fluxo n8n |
| **3** · Confiabilidade e evidências | Auditoria, retentativa, export e provas | HU-09, HU-10, HU-13 + medição | Trilha de auditoria, retentativa, CSV, testes de integração/E2E, carga, prints |
| *Pós* · v1.1 | Alerta de exceções paradas | HU-14 | Branch, PR, changelog, tag |

## Critério de pronto de cada sprint
Código tipado, lint e testes passando, documentação atualizada, review escrita com o que funcionou e o que não funcionou.

## Ordem dentro do Sprint 1 (dependências)
1. Modelo de dados e seed → 2. Extração → 3. Validação (função pura) → 4. Pipeline com idempotência → 5. Endpoint.
