# Sprint 5 · Concorrência e carga

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Anterior: [Sprint 4](sprint-4-orquestracao-n8n.md) · Próxima: [Sprint 6](sprint-6-integracao-analitica-e-evidencias.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Janela de planejamento: 12–16/10/2026.

## Objetivo da sprint

Provar o comportamento do pipeline sob carga (500 mensagens, concorrência 8) e corrigir o que a medição mostrar.

## Escopo

| Requisitos | Regras |
|---|---|
| RNF-01, RNF-02, RF-11 | RN-10, RN-11, RN-12 |

## Entregáveis

- Teste de carga `tests/load/load.ts`: envia as mensagens do gerador (semente 42) a `/api/inbound` e compara a decisão com o rótulo do gerador.
- Duas execuções preservadas: [primeira (com defeitos)](../../04-processo/medicao-resultados-run1.json) e [final](../../04-processo/medicao-resultados.json).
- Correções no pipeline e no extrator, relatório de medição ([relatório](../../04-processo/relatorio-de-medicao.md)).
- Teste de regressão do deadlock, `tests/integration/concurrency.test.ts`, acrescentado na revisão de 24/10/2026.

## Critério de conclusão

500 de 500 decisões iguais ao rótulo, nenhum `PROCESSING_FAILED`, latência medida (p50 e p95).

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `2f2ef7b` | 23/10/2026 | Ordem estável de bloqueios, deadlock tratado como falha transitória, correção do extrator |
| `7415a84` | 23/10/2026 | Relatório de medição |

Detalhes e evidências em [Testes e qualidade](../07-testes-e-qualidade.md#o-defeito-que-a-carga-achou).

## Planning

Meta: não chamar o sistema de confiável sem medir. A carga roda contra o app real e o banco real, com mistura de cenários definida no gerador.

## Review

A primeira execução acertou 491 de 500: 9 divergências, sendo 5 pedidos corretos em `PROCESSING_FAILED` (deadlock) e 4 em `UNKNOWN_SKU` (extrator). A execução final acertou 500 de 500, com p50 de 95,4 ms, p95 de 152,1 ms e vazão de 78,7 mensagens por segundo. Tempo total de 10,9 s para 6,4 s.

## Retrospectiva

- **Funcionou:** manter a execução defeituosa no repositório tornou a correção verificável.
- **Não funcionou:** a suíte não pegava nenhum dos dois defeitos; o deadlock só aparecia com 8 requisições simultâneas e SKUs em ordens diferentes, e a saudação na mesma linha do pedido não estava nos casos do extrator.
- **Ação:** no mesmo commit entraram um teste unitário da classificação do deadlock (40P01) como falha transitória e um teste de regressão do extrator com saudação. Faltava um teste da ordem de bloqueios sob concorrência; ele foi acrescentado em 24/10/2026 (`tests/integration/concurrency.test.ts`). Ampliar os demais casos de extração segue no [roadmap](../09-evolucao-e-roadmap.md).
