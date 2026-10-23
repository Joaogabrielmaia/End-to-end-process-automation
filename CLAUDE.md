# CLAUDE.md — Fluxo

Contexto fixo para qualquer sessão de trabalho neste repositório.

## O que é
Fluxo: automação de pedidos recebidos por e-mail da **Distribuidora Santa Clara** (caso **fictício**). Autor: João Gabriel Maia da Costa. Repositório de portfólio, sem deploy.

## Regras de integridade (não negociáveis)
- Tudo é fictício: pessoas, clientes, produtos, CNPJs e telefones. Nada de marcas ou pessoas reais.
- Reuniões e entrevistas são simuladas. Todo registro simulado começa com: `> Simulação: o Claude interpretou o cliente nesta conversa.`
- Nunca escrever que existe cliente real, operação real ou produção.
- Nunca inventar números. Resultados vêm de execuções reais registradas em `docs/`. Ganho de tempo é **estimativa** com fórmula e entradas visíveis; nunca "reduziu X%".
- Sem deploy, sem link de hospedagem. Tudo local (Docker Compose).
- Sem segredos no repositório (`.env` fica fora do git).

## Estilo
- Documentação em português do Brasil, primeira pessoa. Decisão = contexto, alternativas, escolha, motivo, trade-off, quando mudaria.
- Código tipado, nomes em inglês, textos de interface em português.
- Diagramas em Mermaid. Commits em Conventional Commits, citando IDs (RF-, HU-, RN-, ADR-).

## Comandos
- `docker compose up -d db` — banco local (porta 5436)
- `npm run db:migrate && npm run db:seed`
- `npm run dev` (porta 3100) · `npm test` · `npm run test:e2e` · `npm run load`

## Mapa do código
- `src/lib/extraction/` — `ExtractionProvider`, regras, LLM opcional, provedor determinístico de teste
- `src/lib/validation.ts` — regras de negócio (RN-xx)
- `src/lib/pipeline.ts` — ingestão → extração → validação → registro → notificação
- `src/lib/notify/` — adaptador de notificação
- `src/lib/audit.ts`, `src/lib/metrics.ts`, `src/lib/generator.ts`
