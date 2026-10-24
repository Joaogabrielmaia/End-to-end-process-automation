# Sprint 3 · Exceções, aprovação e auditoria

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Anterior: [Sprint 2](sprint-2-regras-e-extracao.md) · Próxima: [Sprint 4](sprint-4-orquestracao-n8n.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Janela de planejamento: 28/09–02/10/2026.

## Objetivo da sprint

O que dá errado aparece numa fila, com o motivo em português, e pode ser corrigido, aprovado por uma pessoa e reprocessado, com tudo registrado.

## Escopo

| Histórias | Requisitos | Regras |
|---|---|---|
| HU-05, HU-06, HU-07, HU-08, HU-09, HU-11 | RF-07 a RF-10, RF-12, RF-14 | RN-05, RN-07, RN-09 |

## Entregáveis

- Fila de exceções, tela de detalhe com formulário de correção e reprocessamento (`src/app/exceptions`, `src/app/orders/[id]`).
- Aprovação humana de crédito e de alçada, com justificativa obrigatória.
- Trilha de auditoria em tabela que só recebe inserções (`src/lib/audit.ts`), exibida no detalhe do pedido.
- Painel com status, tempos, taxa de revisão e motivos (`src/lib/metrics.ts`), gerador de pedidos de exemplo, cadastros.
- [ADR-005 e ADR-006](../04-arquitetura-e-adrs.md).

## Critério de conclusão

Corrigir não pula validação: o pedido é revalidado e só vira registrado se passar; a aprovação grava quem, quando e por quê; o detalhe mostra a trilha em ordem (HU-06, HU-07, HU-09).

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `2f2ef7b` | 23/10/2026 | Interface, correção e reprocessamento, painel, gerador, medição (o mesmo commit traz as correções da [Sprint 5](sprint-5-concorrencia-e-carga.md)) |

## Planning

Meta: dar à pessoa o controle da exceção sem abrir mão da validação. Decisão de desenho: a correção altera o rascunho e roda a validação de novo (ADR-005).

## Review

Demonstração pelo fluxo: pedido com SKU inexistente cai na fila, o SKU é corrigido, o pedido é registrado e a exceção fica resolvida ([demonstração](../../screenshots/demo-excecao.gif), [captura da fila](../../screenshots/04-fila-de-excecoes.png), [captura da aprovação](../../screenshots/06-aprovacao-humana.png)). O E2E cobre a aprovação de crédito com justificativa obrigatória.

## Retrospectiva

- **Funcionou:** a trilha de auditoria registra o antes e o depois de cada correção, o que facilita explicar uma decisão.
- **Não funcionou:** a auditoria só recebe inserções por convenção do código; o banco não impede alteração ou exclusão ([dívida técnica](../09-evolucao-e-roadmap.md#dívida-técnica)).
- **Ação:** registrar a limitação e avaliar uma restrição no banco como item de evolução.
