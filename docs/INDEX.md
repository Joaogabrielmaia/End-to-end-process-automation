# Série: o pedido que chega por e-mail e vira registro, ou exceção explicada

Guia da documentação do Fluxo, em seis episódios mais um episódio de abertura. Termos e siglas estão no [glossário](GLOSSARIO.md).

## Episódios

| Episódio | Fase | O que tem |
|---|---|---|
| [0 — Sobre este caso](00-sobre-este-caso/README.md) | Abertura | O que é o Fluxo, o que é real e o que é simulado |
| [1 — Discovery](01-discovery/README.md) | Descoberta | Cinco oportunidades e a matriz, o negócio, três reuniões simuladas e o AS-IS |
| [2 — Definição](02-definicao/README.md) | Definição | Requisitos, regras de negócio, histórias, backlog, riscos, rastreabilidade e TO-BE |
| [3 — Arquitetura](03-arquitetura/README.md) | Arquitetura | Sete decisões (ADR-001 a ADR-007) |
| [4 — Processo](04-processo/README.md) | Processo | Fluxo no n8n e relatório de medição, com o deadlock achado e corrigido |
| [5 — Qualidade](05-qualidade/README.md) | Qualidade | Resultados de testes, o que não foi verificado e os logs de execução |
| [6 — Pós-lançamento](06-pos-lancamento/README.md) | Pós-lançamento | Exportação de seis CSVs para Power BI |

Galeria de telas: [`screenshots/README.md`](screenshots/README.md).

## Trilhas de leitura

### Em 2 minutos

1. [README](../README.md)
2. [Fila de exceções (captura)](screenshots/04-fila-de-excecoes.png)
3. [Relatório de medição](04-processo/relatorio-de-medicao.md)

### Em 10 minutos

1. [README](../README.md)
2. [Fila de exceções (captura)](screenshots/04-fila-de-excecoes.png)
3. [Relatório de medição](04-processo/relatorio-de-medicao.md)
4. [Reunião 2: quem lança os pedidos](01-discovery/04-reuniao-lancador-de-pedidos.md)
5. [Regras de negócio](02-definicao/02-regras-de-negocio.md)
6. [ADR-002: onde fica cada regra](03-arquitetura/ADRs.md#adr-002--onde-fica-cada-regra)
7. [ADR-003: idempotência pelo Message-ID](03-arquitetura/ADRs.md#adr-003--idempotência-pelo-identificador-da-mensagem)
8. [ADR-005: como tratar exceções](03-arquitetura/ADRs.md#adr-005--como-tratar-exceções)
9. [O deadlock no relatório de medição](04-processo/relatorio-de-medicao.md#1--medição-do-sistema)

### Em 30 minutos

1. Os nove itens de 10 minutos
2. [Rastreabilidade](02-definicao/06-rastreabilidade.md)
3. [Processo futuro (TO-BE)](02-definicao/07-processo-to-be.md)
4. [n8n: como rodar](04-processo/n8n-como-rodar.md)
5. [Resultados de testes](05-qualidade/01-resultados-de-testes.md)
6. [Exportação CSV para Power BI](06-pos-lancamento/power-bi.md)
