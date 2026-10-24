# Episódio 5 — Qualidade

O registro de 23/10/2026 reúne typecheck sem erros, 76 testes unitários e de integração em 8 arquivos, 5 testes ponta a ponta, 3 cenários do fluxo n8n e a carga de 500 mensagens. O mesmo documento lista o que não foi verificado: caixa de e-mail real (IMAP), provedor LLM, acessibilidade, RNF-07 (portabilidade, só em parte) e RNF-08 (usabilidade).

Os logs abaixo foram gerados em 24/10/2026, na revalidação do commit `522bdc7`, e confirmam lint, typecheck, build, testes e E2E com saída gravada. Os logs do commit `0afe5f7`, da primeira revalidação, ficam como registro anterior. O registro de 23/10 continua como estava; os logs não o substituem.

O `Dockerfile` usa Node 22; os logs abaixo foram gerados com Node 24.14.0.

| Documento | O que contém | Itens |
|---|---|---|
| [Resultados de testes](01-resultados-de-testes.md) | Resumo por camada, n8n, carga e o que não foi verificado | 5 camadas, 5 itens não verificados |
| [Log do lint](execucao-lint-522bdc7.txt) | Saída de `npm run lint` | sem avisos |
| [Log do typecheck](execucao-typecheck-522bdc7.txt) | Saída de `npm run typecheck` | sem erros |
| [Log do build](execucao-build-522bdc7.txt) | Fim da saída de `npm run build` | exit 0 |
| [Log dos testes](execucao-test-522bdc7.txt) | Saída de `npm test` | 76 de 76, 8 arquivos |
| [Log do E2E](execucao-test-e2e-522bdc7.txt) | Saída de `npm run test:e2e` | 5 de 5 |
| Logs anteriores | [typecheck](execucao-typecheck-0afe5f7.txt), [testes](execucao-test-0afe5f7.txt), [E2E](execucao-test-e2e-0afe5f7.txt) | commit `0afe5f7` |

← [Anterior](../04-processo/README.md) · [Índice](../INDEX.md) · [Próximo](../06-pos-lancamento/README.md) →

---
