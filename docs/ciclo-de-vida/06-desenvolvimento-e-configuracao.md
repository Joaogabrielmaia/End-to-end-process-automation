# 6 · Desenvolvimento e configuração

← [Ciclo de vida](README.md) · [Índice](../INDEX.md) · Anterior: [Modelo de dados](05-modelo-de-dados.md) · Próximo: [Testes e qualidade](07-testes-e-qualidade.md)

## Organização do repositório

| Pasta | Conteúdo |
|---|---|
| `src/lib/` | Domínio: pipeline, validação, extração, auditoria, notificação, métricas, exportação, gerador |
| `src/app/` | Interface (Next.js) e rotas de API |
| `prisma/` | Schema, migrations e seed |
| `automations/` | Fluxo do n8n exportado |
| `tests/` | `unit`, `integration`, `e2e` e `load` |
| `scripts/` | Captura das telas (`screenshots.spec.ts`) |
| `docs/` | Discovery, definição, arquitetura, processo, qualidade, pós-lançamento e este ciclo de vida |

Padrões que aparecem no código: validação como função pura ([ADR-002](../03-arquitetura/ADRs.md#adr-002--onde-fica-cada-regra)), adaptadores atrás de interface (`ExtractionProvider`, `Notifier`) e dependências injetadas no pipeline (`PipelineDeps`), o que permite testar com relógio, extração e notificação substituídos.

## Branches, pull requests e commits

| Item | Prática observada |
|---|---|
| Branch principal | `main` |
| Trabalho de implementação | Commits direto na `main`, em sequência linear (`bea867c` a `7415a84`, 23/10/2026) |
| Trabalho de documentação | Uma branch por tema e PR com merge commit: `docs/apresentacao` (PR #1) e `docs/readme-venda` (PR #2), em 24/10/2026; esta revisão em `docs/ciclo-de-vida` |
| Convenção de commits | Conventional Commits em português, citando IDs (RF, HU, RN, ADR), por exemplo `fix(compose): fixa o n8n em 2.44.6 (RNF-07)` |
| Atribuição | Trailer `Co-Authored-By` nos commits |
| Revisão | Não há revisão por segunda pessoa registrada; os PRs foram mesclados pelo autor depois de verificação local |

## Versionamento e releases

`package.json` declara a versão `1.0.0`. Não há tags nem releases, e portanto não há versionamento semântico aplicado. O [CHANGELOG](../../CHANGELOG.md) registra as correções e adições por tema, sem versões. A v1.1 planejada (alerta de exceção parada) ainda não tem código.

## CI/CD e automações

| Item | Situação |
|---|---|
| Workflow de CI (`.github/workflows`) | Não existe; a API do GitHub mostra 0 execuções de Actions |
| Verificação nos PRs | O check GitGuardian (varredura de segredos) aparece nos PRs; é um app do GitHub, não configuração do repositório |
| Verificação local | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm run test:e2e`, com saídas arquivadas em [`docs/05-qualidade`](../05-qualidade/README.md) |
| Deploy | Não existe; o código roda localmente |

Um workflow que rode lint, tipos, testes e build com um serviço PostgreSQL é o próximo passo natural e está no [roadmap](09-evolucao-e-roadmap.md); não foi criado nesta revisão.

## Ambientes e configuração

| Ambiente | Como existe | Configuração |
|---|---|---|
| Desenvolvimento local | PostgreSQL e n8n por Docker Compose; app Next.js no host | `.env` a partir de `.env.example` (valores de exemplo) |
| Teste | Banco separado `fluxo_test`; E2E sobre o app construído | Variáveis em `tests/setup-db.ts` e `playwright.config.ts` |
| Produção | Não existe | — |

Variáveis relevantes de `.env.example`: URL do banco, chave do endpoint de entrada, provedor de extração (`rules` ou `rules+llm`), canal de notificação (`simulated` ou `webhook`) e o limite de horas do alerta de exceção parada (lida pela configuração, sem código que a use). As instruções de execução estão em [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Dependências e segredos

- **Dependências** fixadas em `package-lock.json`; versões principais: Next.js 15, React 19, Prisma 6, Zod 4, TypeScript 6, Vitest 5, Playwright 1.64.
- **Segredos:** `.env` está no `.gitignore`; `.env.example` e `docker-compose.yml` contêm apenas valores de exemplo para uso local. A varredura de 24/10/2026 no histórico não achou chave de API nem chave privada; os padrões de URL de banco encontrados apontam para `localhost` e para o serviço `db`.
- **Imagem do n8n** fixada em `n8nio/n8n:2.44.6`, depois de a documentação e os testes citarem essa versão enquanto o compose usava `latest`.

## Histórico de mudanças relevantes

| Commit | Data | Mudança |
|---|---|---|
| `bea867c` | 23/10/2026 | Estrutura inicial |
| `9b15ba3` | 23/10/2026 | Discovery e definição |
| `55b7464` | 23/10/2026 | Pipeline, schema, ADRs |
| `2f2ef7b` | 23/10/2026 | Interface, CSV, medição; correção do deadlock e do extrator |
| `d5c832b` | 23/10/2026 | Fluxo n8n e rota de alerta |
| `57d8f16` | 23/10/2026 | Ajuste do E2E após resolver a exceção |
| `dfb83b4` | 23/10/2026 | Teste da rota de alerta; documentos |
| `7415a84` | 23/10/2026 | README e relatório de medição |
| `0afe5f7` a `522bdc7` | 24/10/2026 | Capturas, logs, compose com n8n fixado, `vitest.config.mts` |
| PR #1 e PR #2 | 24/10/2026 | Apresentação em série e README de competência |
| esta branch | 24/10/2026 | Ciclo de vida, testes de métricas e de concorrência |

Impacto sobre compatibilidade: a remoção dos scripts `orders:generate` e `export:csv` do `package.json` não quebra nada, porque ambos apontavam para arquivos que não existiam; a exportação é pela rota `GET /api/export/<nome>.csv`.

## Dívida técnica e refatoração

A dívida priorizada está em [Evolução e roadmap](09-evolucao-e-roadmap.md#dívida-técnica). A estratégia de refatoração é pontual e guiada por teste: antes de mexer em regra, o caso de teste entra; o defeito do deadlock seguiu essa ordem (correção, depois teste de regressão).

---

**Natureza dos registros.** Todos os itens vêm do repositório (`git log`, `package.json`, `.gitignore`, `docker-compose.yml`) e da API pública do GitHub; não há registro de CI porque não existe workflow.
