# Sprint 4 · Orquestração no n8n

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Anterior: [Sprint 3](sprint-3-excecoes-aprovacao-e-auditoria.md) · Próxima: [Sprint 5](sprint-5-concorrencia-e-carga.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Janela de planejamento: 05–09/10/2026.

## Objetivo da sprint

Receber o pedido por um fluxo do n8n, com retentativa e alerta quando o envio ao Fluxo falha.

## Escopo

| Histórias | Requisitos | Regras |
|---|---|---|
| HU-10 | RF-01, RF-06, RF-11 | RN-10, RN-12 |

## Entregáveis

- Fluxo exportado `automations/fluxo-recebimento-de-pedidos.json`: webhook, montagem da mensagem, envio ao Fluxo com 3 tentativas e 2 s entre elas, desvios de reenvio, registrado e exceção, alerta em caso de falha.
- Rota `POST /api/notify` para o alerta, com chave de API (RNF-06).
- Teste E2E do fluxo e teste de integração da rota de alerta.
- Documento do n8n com a decisão sobre o canal de alerta ([n8n](../../04-processo/n8n-como-rodar.md)).

## Critério de conclusão

Três cenários observados no n8n 2.44.6: pedido registrado, reenvio ignorado e alerta após 3 tentativas ([resultados](../../05-qualidade/01-resultados-de-testes.md)).

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `d5c832b` | 23/10/2026 | Fluxo do n8n, rota `/api/notify`, teste E2E |
| `57d8f16` | 23/10/2026 | Asserções do E2E ajustadas ao formulário que some após resolver a exceção |
| `dfb83b4` | 23/10/2026 | Teste da rota `/api/notify`; documentos de testes e do n8n |

## Planning

Meta: n8n só orquestra; as regras ficam em código testável ([ADR-001](../../03-arquitetura/ADRs.md#adr-001--n8n-ou-código-puro)). Decisão: o alerta passa pelo próprio app (`/api/notify`), para ter um canal único e testável sem credencial externa.

## Review

Os três cenários passaram. Limite declarado: a falha foi provocada com um erro 400, não com o app fora do ar; nesse caso o alerta também falharia.

## Retrospectiva

- **Funcionou:** manter o pipeline utilizável sem o n8n permitiu testar tudo sem ele.
- **Não funcionou:** na versão 2.44.6, `publish:workflow` e `update:workflow --active=true` marcam o fluxo como ativo, mas o webhook não é registrado após reinício; duas importações do mesmo fluxo colidem no caminho do webhook.
- **Ação:** registrar a armadilha no documento do n8n e fixar a imagem em `n8nio/n8n:2.44.6` (feito depois, ver [CHANGELOG](../../../CHANGELOG.md)).
