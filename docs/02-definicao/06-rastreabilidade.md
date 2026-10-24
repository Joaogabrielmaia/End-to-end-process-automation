# 06 · Rastreabilidade

Do que o negócio pediu até o teste que prova. Os arquivos citados existem no repositório; onde não há teste, a célula diz isso.

| Origem (descoberta) | HU | RF | RN | Código | Teste |
|---|---|---|---|---|---|
| Reunião 2: "pedido vem de vários jeitos" | HU-02 | RF-03 | RN-09 | `src/lib/extraction/rules.ts` | `tests/unit/extraction.test.ts` |
| Reunião 2: "conheço pelo e-mail" | HU-03 | RF-04 | RN-02 | `src/lib/validation.ts` | `tests/unit/validation.test.ts` |
| Reunião 2: código parecido | HU-03 | RF-04 | RN-03, RN-04 | `src/lib/validation.ts` | `tests/unit/validation.test.ts` |
| Reuniões 1 e 3: falta de estoque | HU-03 | RF-04 | RN-06 | `src/lib/validation.ts` | `tests/unit/validation.test.ts` |
| Reuniões 1 e 2: crédito | HU-03, HU-07 | RF-04, RF-09 | RN-05 | `src/lib/validation.ts` | `tests/unit/validation.test.ts`, `tests/integration/pipeline.test.ts` |
| Reunião 1: acima de R$ 15.000 | HU-07 | RF-09 | RN-07 | `src/lib/validation.ts` | `tests/unit/validation.test.ts` |
| Reunião 2: prazo padrão | HU-03 | RF-04 | RN-08 | `src/lib/business-days.ts` | `tests/unit/business-days.test.ts` |
| Reunião 3: reenvio | HU-04 | RF-02 | RN-10 | `src/lib/pipeline.ts` | `tests/integration/pipeline.test.ts` |
| Reunião 1: "tudo automático" | HU-01 | RF-01, RF-05 | RN-11 | `src/lib/pipeline.ts` | `tests/integration/pipeline.test.ts`, `tests/integration/concurrency.test.ts`, `tests/e2e/flow.spec.ts` |
| Reunião 2: "prefiro que pergunte" | HU-05, HU-06 | RF-07, RF-08 | RN-09 | `src/app/exceptions`, `src/lib/pipeline.ts` | `tests/e2e/flow.spec.ts` |
| Reunião 1: painel | HU-08 | RF-12 | — | `src/lib/metrics.ts` | `tests/integration/metrics.test.ts` |
| Reunião 1: "quem decidiu" | HU-09 | RF-10 | — | `src/lib/audit.ts` | `tests/integration/pipeline.test.ts` |
| Engenharia | HU-10 | RF-11 | RN-12 | `src/lib/retry.ts` | `tests/unit/retry.test.ts`, `tests/integration/pipeline.test.ts` |
| Reunião 1: parado | HU-14 | RF-16 | RN-13 | planejado (v1.1); sem código | planejado (v1.1); sem teste |
