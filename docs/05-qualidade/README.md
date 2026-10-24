# Episódio 5 — Qualidade

O registro de 23/10/2026 reúne typecheck sem erros, 76 testes unitários e de integração em 8 arquivos, 5 testes ponta a ponta, 3 cenários do fluxo n8n e a carga de 500 mensagens. O mesmo documento lista o que não foi verificado: caixa de e-mail real (IMAP), provedor LLM, acessibilidade, RNF-07 (portabilidade, só em parte) e RNF-08 (usabilidade).

Os logs mais recentes são de 24/10/2026, do commit `09f1d18` (lint, typecheck, build e E2E sem erros, 80 de 80 testes unitários e de integração). Os de `522bdc7` (76 de 76) e `0afe5f7` ficam como registros anteriores; a diferença para 80 são os testes de painel e de concorrência. O registro de 23/10 continua como estava; os logs não o substituem.

O `Dockerfile` usa Node 22; os logs abaixo foram gerados com Node 24.14.0.

| Documento | O que contém | Itens |
|---|---|---|
| [Resultados de testes](01-resultados-de-testes.md) | Resumo por camada, n8n, carga e o que não foi verificado | 5 camadas, 5 itens não verificados |
| [Log do lint](execucao-lint-09f1d18.txt) | Saída de `npm run lint` | sem avisos |
| [Log do typecheck](execucao-typecheck-09f1d18.txt) | Saída de `npm run typecheck` | sem erros |
| [Log do build](execucao-build-09f1d18.txt) | Fim da saída de `npm run build` | exit 0 |
| [Log dos testes](execucao-test-09f1d18.txt) | Saída de `npm test` | 80 de 80, 10 arquivos |
| [Log do E2E](execucao-test-e2e-09f1d18.txt) | Saída de `npm run test:e2e` | 5 de 5 |
| Logs anteriores | [522bdc7: lint](execucao-lint-522bdc7.txt), [typecheck](execucao-typecheck-522bdc7.txt), [build](execucao-build-522bdc7.txt), [testes](execucao-test-522bdc7.txt), [E2E](execucao-test-e2e-522bdc7.txt); [0afe5f7: typecheck](execucao-typecheck-0afe5f7.txt), [testes](execucao-test-0afe5f7.txt), [E2E](execucao-test-e2e-0afe5f7.txt) | 76 de 76 e 5 de 5 |

← [Anterior](../04-processo/README.md) · [Índice](../INDEX.md) · [Próximo](../06-pos-lancamento/README.md) →

---
