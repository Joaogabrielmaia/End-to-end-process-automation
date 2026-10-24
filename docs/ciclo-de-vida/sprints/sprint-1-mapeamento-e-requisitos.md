# Sprint 1 · Mapeamento e requisitos

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Próxima: [Sprint 2](sprint-2-regras-e-extracao.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Participantes por papel: Product Owner (gerência comercial), Scrum Master, desenvolvimento. Janela de planejamento: 14–18/09/2026.

## Objetivo da sprint

Entender como os pedidos entram e são lançados hoje, escolher o que automatizar e fixar escopo, regras e requisitos antes de escrever código.

## Escopo

| Item | Origem |
|---|---|
| Brainstorm de cinco oportunidades e matriz de decisão (vence "pedidos por e-mail", nota 4,35) | [Oportunidades](../../01-discovery/01-oportunidades.md) |
| Retrato do negócio e dos erros comuns | [O negócio](../../01-discovery/02-negocio.md) |
| Três reuniões de discovery | [Reunião 1](../../01-discovery/03-reuniao-gerente-comercial.md), [Reunião 2](../../01-discovery/04-reuniao-lancador-de-pedidos.md), [Reunião 3](../../01-discovery/05-reuniao-cliente-tipo.md) |
| Processo atual, gargalos e método de medição | [AS-IS](../../01-discovery/06-processo-atual-as-is.md) |
| 16 RF, 8 RNF, 13 RN, 16 HU, 10 riscos | [Definição](../../02-definicao/README.md) |

## Entregáveis

Documentos de discovery e definição, backlog priorizado por MoSCoW, mapa de riscos e a estrutura inicial do repositório (Docker Compose, TypeScript, Next.js, Prisma).

## Critério de conclusão

Cada regra tem ID, código de exceção e origem na descoberta; cada requisito Must tem pelo menos uma história com critério de aceite; o escopo e o fora de escopo estão escritos ([visão e discovery](../01-visao-e-discovery.md)).

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `bea867c` | 23/10/2026 | Estrutura inicial: `package.json`, `Dockerfile`, `docker-compose.yml`, configurações |
| `9b15ba3` | 23/10/2026 | Discovery e definição: atas, requisitos, regras, histórias, riscos |

## Planning

Meta aceita: sair com o escopo fechado e as contradições entre as reuniões resolvidas em regra. Itens puxados: todos os de discovery e definição. Fora da sprint: qualquer código de pipeline.

## Review

Entregue o conjunto completo. Duas mudanças de escopo aceitas ao longo das reuniões: a alçada de R$ 15.000 (RN-07) e a exceção de crédito aprovável por humano (RN-05, RF-09). Recusados: ERP real e leitura de foto de lista escrita à mão ([registro de mudanças](../03-requisitos-e-rastreabilidade.md#registro-de-mudanças)).

## Retrospectiva

- **Funcionou:** confrontar as reuniões revelou contradições (limite de crédito "sempre" respeitado × liberado por telefone; planilha padrão × metade em texto livre) que viraram regras explícitas.
- **Não funcionou:** os tempos do processo atual são estimativa de um personagem simulado; a medição real existe só como método.
- **Ação:** manter a estimativa de ganho com fórmula e entradas visíveis, e medir o sistema (S5) em vez de prometer ganho.
