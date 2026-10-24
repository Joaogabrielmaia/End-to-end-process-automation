# 2 · Planejamento e Scrum

← [Ciclo de vida](README.md) · [Índice](../INDEX.md) · Anterior: [Visão e discovery](01-visao-e-discovery.md) · Próximo: [Requisitos e rastreabilidade](03-requisitos-e-rastreabilidade.md)

## Product Goal

Todo pedido que chega por e-mail vira um registro validado ou uma exceção explicada, sem depender de alguém olhando a caixa de entrada ([visão](01-visao-e-discovery.md#visão-do-produto)).

## Product Backlog priorizado

Prioridade por MoSCoW ([histórias e critérios de aceite](../02-definicao/03-historias-e-moscow.md)); a ordem dentro de cada faixa segue a dependência técnica. "Situação" vem do código e dos testes do repositório.

| Ordem | História | MoSCoW | Sprint | Situação |
|---|---|---|---|---|
| 1 | HU-01 Pedido entra sozinho | Must | S2 | Feita |
| 2 | HU-03 Validação de cliente, SKU, quantidade, estoque e crédito | Must | S2 | Feita |
| 3 | HU-02 Texto livre | Must | S2 | Feita |
| 4 | HU-04 Reenvio sem duplicar | Must | S2 | Feita |
| 5 | HU-05 Fila de exceções com motivo | Must | S3 | Feita |
| 6 | HU-06 Corrigir e reprocessar | Must | S3 | Feita |
| 7 | HU-09 Trilha de auditoria | Must | S3 | Feita |
| 8 | HU-08 Painel | Must | S3 | Feita |
| 9 | HU-07 Aprovação de crédito e alçada | Should | S3 | Feita |
| 10 | HU-10 Retentativa e alerta de falha | Should | S4 | Feita |
| 11 | HU-11 Gerador de pedidos | Should | S3 | Feita |
| 12 | HU-12 Cadastros com seed | Should | S2 | Feita |
| 13 | HU-13 CSV para Power BI | Could | S6 | Feita (relatório de BI não existe) |
| 14 | HU-14 Alerta de exceção parada | Could | v1.1 | Planejada, sem código |
| 15 | HU-15 Confirmação por e-mail ao cliente | Won't | Roadmap | Fora desta versão |
| 16 | HU-16 Foto de lista escrita à mão | Won't | — | Recusada |

A distribuição por MoSCoW é 8 Must, 4 Should, 2 Could e 2 Won't. O backlog original em [3 sprints lógicos](../02-definicao/04-backlog-sprints.md) corresponde às seis sprints assim: núcleo do pipeline → S2; exceções, notificação e painel → S3 e S4; confiabilidade e evidências → S5 e S6. A S1 cobre o discovery que antecede o código.

## Release plan

| Release | Conteúdo | Situação |
|---|---|---|
| v1.0 (estudo) | S2 a S6: pipeline, fila, auditoria, n8n, CSV, carga 500/500 | Código no repositório; sem tag nem release publicada |
| v1.1 | HU-14: alerta de exceção parada (RF-16, RN-13) | Planejada, sem código |
| Roadmap | Alerta fora do app, confirmação ao cliente, verificação de IMAP e LLM, relatório de Power BI | [Evolução](09-evolucao-e-roadmap.md) |

## Plano de sprints

Seis sprints de uma semana; objetivo, escopo, entregáveis, critério de conclusão, planning, review e retrospectiva em cada página. Janelas de planejamento do cenário e commits reais estão lado a lado.

| Sprint | Objetivo | Histórias | Registro no Git |
|---|---|---|---|
| [S1](sprints/sprint-1-mapeamento-e-requisitos.md) | Mapear e definir | Discovery e definição | `bea867c`, `9b15ba3` |
| [S2](sprints/sprint-2-regras-e-extracao.md) | Regras e extração | HU-01 a HU-04, HU-12 | `55b7464` |
| [S3](sprints/sprint-3-excecoes-aprovacao-e-auditoria.md) | Exceções, aprovação, auditoria | HU-05 a HU-09, HU-11 | `2f2ef7b` |
| [S4](sprints/sprint-4-orquestracao-n8n.md) | Orquestração no n8n | HU-10 | `d5c832b`, `57d8f16`, `dfb83b4` |
| [S5](sprints/sprint-5-concorrencia-e-carga.md) | Concorrência e carga | RNF-01, RN-11, RN-12 | `2f2ef7b`, `7415a84` |
| [S6](sprints/sprint-6-integracao-analitica-e-evidencias.md) | Integração analítica e evidências | HU-13 | `2f2ef7b`, `dfb83b4`, `7415a84` |

A história de evolução do produto: S2 prova o caminho feliz; S3 trata o que dá errado; S4 coloca o recebimento sob orquestração; S5 submete tudo à carga e devolve defeitos às sprints anteriores; S6 entrega os dados e fecha as evidências.

## Cerimônias

Registradas por sprint como artefato do cenário: planning (meta e itens puxados), review (o que foi demonstrado) e retrospectiva (o que funcionou, o que não funcionou, ação). Refinamento do backlog: a cada review, os itens novos (HU-14, HU-15) entram ordenados por MoSCoW e dependência. Definition of Ready e Definition of Done estão em [Sprints](sprints/README.md#definition-of-ready).

## Riscos, impedimentos e dependências

| Tipo | Item | Tratamento |
|---|---|---|
| Risco | RK-01 a RK-10 | [Mapa de riscos](../02-definicao/05-riscos.md), com mitigação ligada a regra ou ADR |
| Impedimento | n8n 2.44.6 não registra o webhook após `publish:workflow` | Ativação pelo editor; armadilha documentada ([n8n](../04-processo/n8n-como-rodar.md)) |
| Impedimento | Deadlock sob 8 requisições simultâneas | Corrigido (S5) e coberto por teste de regressão |
| Dependência | Estoque e crédito vêm de exportação diária do ERP | Premissa: carga por seed ou CSV |
| Dependência | Banco PostgreSQL local para testes (`fluxo_test`) | Teste de integração usa banco separado |

## Critérios para repriorizar o backlog

1. Uma exceção ou falha que apareça com frequência no painel sobe de prioridade (RK-07: excesso de exceções anula o ganho).
2. Um defeito achado em medição ou teste entra na sprint seguinte antes de nova funcionalidade (caso do deadlock).
3. Pedido de mudança que altere regra de negócio exige nova RN, nova história e teste antes de entrar.
4. Item Could só sobe se não deslocar nenhum Must.

## Indicadores de fluxo e entrega

Não há story points, velocity, lead time nem burndown no repositório, e este documento não apresenta nenhum. O que existe e é verificável: contagem de histórias por sprint (acima), data real de cada commit e o histórico de [mudanças](03-requisitos-e-rastreabilidade.md#registro-de-mudanças).

---

**Natureza dos registros.** Janelas e cerimônias são artefatos de planejamento do cenário; "Situação" e "Registro no Git" são evidências observadas.
