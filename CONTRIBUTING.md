# Contribuindo

Instruções para rodar o Fluxo localmente.

## Requisitos

Node 22 ou superior (os logs de 24/10/2026 usaram Node 24.14.0) e Docker.

## Subir o ambiente

```bash
cp .env.example .env            # valores de exemplo, só para uso local
docker compose up -d db         # Postgres na porta 5436
npm install
npm run db:migrate && npm run db:seed
npm run dev                     # http://localhost:3100
```

Opcional: `docker compose up -d n8n` e o passo a passo em [`docs/04-processo/n8n-como-rodar.md`](docs/04-processo/n8n-como-rodar.md).

## Comandos

| Comando | Para quê |
|---|---|
| `npm test` | unitários e integração (banco separado `fluxo_test`) |
| `npm run test:e2e` | ponta a ponta no navegador (precisa de `npm run build`) |
| `npm run load` | carga com 500 mensagens; sobrescreve `docs/04-processo/medicao-resultados.json` |
| `npm run screenshots` | refaz as capturas de `docs/screenshots` (app no ar; `scripts/screenshots.spec.ts`) |

Os CSVs saem por `GET /api/export/<nome>.csv`, como descrito em [`docs/06-pos-lancamento/power-bi.md`](docs/06-pos-lancamento/power-bi.md).
