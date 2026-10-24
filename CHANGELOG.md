# Changelog

Sem tags nem versões publicadas; as entradas seguem a ordem do trabalho na branch `docs/apresentacao`.

## Corrigido

- `docker-compose.yml`: o n8n usava `n8nio/n8n:latest`, enquanto a documentação e os testes citam a 2.44.6; a imagem agora é `n8nio/n8n:2.44.6`.
- `vitest.config.ts` virou `vitest.config.mts`: o arquivo usava sintaxe ESM carregada como CommonJS e gerava aviso a cada `npm test`.
- `package.json`: removidos `orders:generate` e `export:csv`, que apontavam para arquivos inexistentes; a exportação é pela rota `GET /api/export/<nome>.csv`.
- Rastreabilidade e backlog: removidos alvos de teste inexistentes e promessas sem arquivo (revisão por sprint, tag); RF-16, RN-13 e HU-14 constam como planejados, sem código nem teste.

## Adicionado

- Capturas de tela reais em `docs/screenshots/`, GIF de demonstração, `npm run screenshots` e `docs/social-preview.png`.
- Páginas de episódio, trilhas de leitura em `docs/INDEX.md` e `docs/GLOSSARIO.md`.
- Logs de execução de typecheck, testes e E2E em `docs/05-qualidade/`.
