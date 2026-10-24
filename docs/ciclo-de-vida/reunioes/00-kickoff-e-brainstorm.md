# Kickoff e brainstorm

← [Reuniões](README.md) · [Ciclo de vida](../README.md)

> Reunião simulada; pessoas e empresa fictícias. Registro do cenário, reconstruído a partir da [matriz de oportunidades](../../01-discovery/01-oportunidades.md) e do [retrato do negócio](../../01-discovery/02-negocio.md).

- **Participantes (por papel):** Product Owner da distribuidora, desenvolvimento.
- **Janela de planejamento:** início da [Sprint 1](../sprints/sprint-1-mapeamento-e-requisitos.md) (14/09/2026).
- **Objetivo:** escolher o que automatizar e combinar como o trabalho de discovery vai acontecer.

## Pauta

1. Panorama da empresa: 15 pessoas, cerca de 80 pedidos por dia por e-mail, todos lançados à mão numa planilha.
2. Brainstorm de cinco oportunidades: pedidos por e-mail, cobrança, conferência de estoque, cotação, relatórios gerenciais.
3. Critérios e pesos: frequência (0,25), volume (0,25), erro (0,20), esforço (0,15) e risco (0,15).
4. Perguntas para as reuniões de discovery e quem será ouvido.

## Perguntas de discovery acordadas

| Para quem | Perguntas |
|---|---|
| Gerência comercial | Qual é o maior problema hoje? O que "tudo automático" significa? Quais regras são da gerência (crédito, alçada, estoque)? Como quer saber se algo ficou parado? |
| Quem lança os pedidos | Em que formatos os pedidos chegam? Quanto tempo leva cada um e onde o tempo vai? O que mais dá erro? Qual é a restrição de integração com o ERP? |
| Cliente | Como faz o pedido? O que o incomoda? Reenviar o e-mail é um problema? O que espera quando falta um item? |

## Decisões

| Decisão | Base |
|---|---|
| Automatizar "pedidos por e-mail": nota 4,35, contra 3,50 de cotação, 3,30 de conferência de estoque, 3,00 de cobrança e 2,75 de relatórios | Matriz de oportunidades |
| A decisão se sustenta com pesos alternativos: dobrando esforço e risco, "pedidos por e-mail" continua em primeiro (4,40) | Análise de sensibilidade na matriz |
| Ouvir três perfis: gerência comercial, quem lança e um cliente-tipo | Pauta de discovery |
| Medir antes de prometer ganho: o AS-IS terá método de medição e o ganho será estimativa com fórmula | [AS-IS](../../01-discovery/06-processo-atual-as-is.md) |

## Quando a decisão mudaria

Se o volume fosse menor que 20 pedidos por dia ou se a distribuidora já tivesse EDI com os clientes, a cotação ou a conferência de estoque passariam na frente ([matriz](../../01-discovery/01-oportunidades.md)).
