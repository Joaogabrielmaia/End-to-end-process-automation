# Changelog

Sem tags nem versões publicadas; as entradas agrupam as mudanças por tipo.

## Corrigido

- `docs/04-processo/relatorio-de-medicao.md`: a execução 1 tinha 9 divergências, não só as 5 do deadlock; as outras 4 (`UNKNOWN_SKU`) vieram do extrator, corrigido no mesmo commit `2f2ef7b`. O relatório e os resultados de testes passam a explicar as duas causas.
- `docs/03-arquitetura/ADRs.md`: nota de revisão no ADR-003; o hash de conteúdo não inclui o `Date` do e-mail e usa janela de 24 horas.
- `docker-compose.yml`: o n8n usava `n8nio/n8n:latest`, enquanto a documentação e os testes citam a 2.44.6; a imagem agora é `n8nio/n8n:2.44.6`.
- `vitest.config.ts` virou `vitest.config.mts`: o arquivo usava sintaxe ESM carregada como CommonJS e gerava aviso a cada `npm test`.
- `package.json`: removidos `orders:generate` e `export:csv`, que apontavam para arquivos inexistentes; a exportação é pela rota `GET /api/export/<nome>.csv`.
- Rastreabilidade e backlog: removidos alvos de teste inexistentes e promessas sem arquivo (revisão por sprint, tag); RF-16, RN-13 e HU-14 constam como planejados, sem código nem teste.

## Adicionado

- `tests/integration/metrics.test.ts` (3 testes do painel, RF-12) e `tests/integration/concurrency.test.ts` (regressão do deadlock, RN-11 e RN-12); a suíte passa de 76 para 80 testes.
- `docs/ciclo-de-vida/`: documentos de discovery, Scrum, requisitos, arquitetura, dados, desenvolvimento, testes, implantação e evolução, com sprints, reuniões e catálogo de diagramas.
- Logs de lint, typecheck, build, testes e E2E do commit `09f1d18` em `docs/05-qualidade/`.

- Capturas de tela reais em `docs/screenshots/`, GIF de demonstração, `npm run screenshots` e `docs/social-preview.png`.
- Páginas de episódio, trilhas de leitura em `docs/INDEX.md` e `docs/GLOSSARIO.md`.
- Logs de execução de typecheck, testes e E2E em `docs/05-qualidade/`.
