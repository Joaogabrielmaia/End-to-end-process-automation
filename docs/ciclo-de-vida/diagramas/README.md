# Catálogo de diagramas

← [Ciclo de vida](../README.md) · [Índice](../../INDEX.md)

Todos os diagramas são Mermaid, escritos no próprio Markdown (a fonte editável é o bloco de código) e renderizados pelo GitHub. Não há imagens exportadas: um diagrama ilustrativo apresentado como captura de tela seria enganoso, e o Mermaid acompanha o texto na revisão.

| Diagrama | Tipo | Onde está | O que mostra | Fonte de verdade |
|---|---|---|---|---|
| Janelas de sprint | Gantt | [Ciclo de vida](../README.md#linha-do-tempo) | Janelas de planejamento do cenário | [Sprints](../sprints/README.md) |
| Evolução por versão | Fluxo | [Ciclo de vida](../README.md#evolução-por-versão) | v1.0, v1.1 e roadmap | [Evolução](../09-evolucao-e-roadmap.md) |
| Encadeamento das sprints | Fluxo | [Sprints](../sprints/README.md) | S1 a S6 e o retorno do defeito | Páginas das sprints |
| AS-IS | Fluxo com raias | [Visão e discovery](../01-visao-e-discovery.md#processo-atual-as-is) | Atores, decisões e pontos de espera do processo manual | [AS-IS](../../01-discovery/06-processo-atual-as-is.md) |
| TO-BE | Fluxo com raias | [Visão e discovery](../01-visao-e-discovery.md#processo-com-o-fluxo-to-be) | Idempotência, validação, exceção, aprovação e correção | `src/lib/pipeline.ts` |
| Rastreabilidade | Fluxo | [Requisitos](../03-requisitos-e-rastreabilidade.md#do-que-o-cliente-pediu-até-o-teste) | Necessidade → história → requisito → regra → código → teste → evidência | Matriz da mesma página |
| Contexto (C4 1) | Fluxo | [Arquitetura](../04-arquitetura-e-adrs.md#contexto-c4-nível-1) | Pessoas, sistema e sistemas externos | Código e ADRs |
| Contêineres (C4 2) | Fluxo | [Arquitetura](../04-arquitetura-e-adrs.md#contêineres-c4-nível-2) | n8n, aplicação, banco | `docker-compose.yml`, `src/app` |
| Componentes | Fluxo | [Arquitetura](../04-arquitetura-e-adrs.md#componentes-da-biblioteca-de-domínio) | Módulos de `src/lib` | `src/lib` |
| Sequência: pedido chega | Sequência | [Arquitetura](../04-arquitetura-e-adrs.md#sequência-do-fluxo-principal-pedido-chega) | Do n8n ao registro ou à exceção | `ingestMessage` |
| Sequência: correção e aprovação | Sequência | [Arquitetura](../04-arquitetura-e-adrs.md#sequência-correção-e-aprovação-na-fila) | Reprocessamento com auditoria | `reprocessOrder` |
| Estados | Estados | [Arquitetura](../04-arquitetura-e-adrs.md#estados) | Pedido, exceção e mensagem | `prisma/schema.prisma`, pipeline |
| Modelo ER | ER | [Modelo de dados](../05-modelo-de-dados.md#modelo-entidade-relacionamento) | Entidades, relações, chaves e restrições | `prisma/schema.prisma`, migrations |
| Pirâmide de testes | Fluxo | [Testes](../07-testes-e-qualidade.md#estratégia) | Camadas e quantidade de testes | `tests/` |
| Arquitetura-alvo | Fluxo | [Implantação](../08-implantacao-e-operacao.md#arquitetura-de-implantação-planejada) | Alvo planejado, que não existe | Plano do cenário |
| Roadmap | Fluxo | [Evolução](../09-evolucao-e-roadmap.md#roadmap) | v1.1, v1.2 e v2.0 | Proposta |

Fluxos já existentes fora desta pasta: o fluxo geral e o do n8n em [`n8n-como-rodar.md`](../../04-processo/n8n-como-rodar.md), o AS-IS e o TO-BE lado a lado em [`07-processo-to-be.md`](../../02-definicao/07-processo-to-be.md) e o ER sugerido para o Power BI em [`power-bi.md`](../../06-pos-lancamento/power-bi.md).

## Conferência

Os diagramas de arquitetura, dados e estados foram escritos a partir do código atual; o ER e o dicionário foram conferidos contra o schema e as migrations. Os diagramas de arquitetura-alvo, roadmap e janelas de sprint são de planejamento e estão rotulados como tal.
