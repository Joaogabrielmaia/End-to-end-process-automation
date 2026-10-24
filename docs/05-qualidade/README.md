# Episódio 5 — Qualidade

O registro de 23/10/2026 reúne typecheck sem erros, 76 testes unitários e de integração em 8 arquivos, 5 testes ponta a ponta, 3 cenários do fluxo n8n e a carga de 500 mensagens. O mesmo documento lista o que não foi verificado: caixa de e-mail real (IMAP), provedor LLM, acessibilidade, RNF-07 (portabilidade, só em parte) e RNF-08 (usabilidade).

Os três logs abaixo foram gerados depois, na revalidação do commit `0afe5f7`, e confirmam os números de typecheck, testes e E2E com saída gravada. O registro de 23/10 continua como estava; os logs não o substituem.

O `Dockerfile` usa Node 22; os logs abaixo foram gerados com Node 24.14.0.

| Documento | O que contém | Itens |
|---|---|---|
| [Resultados de testes](01-resultados-de-testes.md) | Resumo por camada, n8n, carga e o que não foi verificado | 5 camadas, 5 itens não verificados |
| [Log do typecheck](execucao-typecheck-0afe5f7.txt) | Saída de `npm run typecheck` | sem erros |
| [Log dos testes](execucao-test-0afe5f7.txt) | Saída de `npm test` | 76 de 76, 8 arquivos |
| [Log do E2E](execucao-test-e2e-0afe5f7.txt) | Saída de `npm run test:e2e` | 5 de 5 |

← [Anterior](../04-processo/README.md) · [Índice](../INDEX.md) · [Próximo](../06-pos-lancamento/README.md) →

---
