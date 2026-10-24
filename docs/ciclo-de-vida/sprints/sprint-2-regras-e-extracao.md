# Sprint 2 · Regras e extração

← [Sprints](README.md) · [Ciclo de vida](../README.md) · Anterior: [Sprint 1](sprint-1-mapeamento-e-requisitos.md) · Próxima: [Sprint 3](sprint-3-excecoes-aprovacao-e-auditoria.md)

> Registro do cenário, elaborado a partir das evidências do repositório; não é ata contemporânea. Janela de planejamento: 21–25/09/2026.

## Objetivo da sprint

Um pedido bem formatado entra, é validado e registrado, sem duplicar.

## Escopo

| Histórias | Requisitos | Regras |
|---|---|---|
| HU-01, HU-02, HU-03, HU-04, HU-12 | RF-01 a RF-06, RF-13 | RN-01 a RN-04, RN-06, RN-08 a RN-11 |

## Entregáveis

- Endpoint de entrada `POST /api/inbound`, com chave de API (RNF-06).
- Extração por regras atrás de `ExtractionProvider`, com provedor determinístico para teste e LLM opcional (`src/lib/extraction/`).
- Validação como função pura (`src/lib/validation.ts`) e dias úteis (`src/lib/business-days.ts`).
- Pipeline com idempotência e registro atômico (`src/lib/pipeline.ts`), schema e migrations do banco, seed fictício.
- [ADR-001 a ADR-004](../04-arquitetura-e-adrs.md).

## Critério de conclusão

Cada regra RN-02 a RN-09 tem um caso de teste que gera o código de exceção esperado (HU-03); o mesmo e-mail duas vezes gera um só pedido (HU-04); o registro reserva estoque e crédito na mesma transação (RN-11).

## Registro no Git

| Commit | Data | O que entrou |
|---|---|---|
| `55b7464` | 23/10/2026 | Pipeline, extração, validação, idempotência, schema, migrations, ADRs, testes unitários e de integração |

## Planning

Meta: caminho feliz e idempotência de ponta a ponta antes de qualquer tela. A validação foi isolada do banco (ADR-002) para ser testável sem infraestrutura.

## Review

Entregue: o pipeline registra o pedido válido e manda o duvidoso para exceção; testes de integração cobrem registro, texto livre, PDF, duplicata (mesmo identificador e mesmo conteúdo), entregas simultâneas do mesmo e-mail e disputa pelo último estoque ([resultados](../07-testes-e-qualidade.md)).

## Retrospectiva

- **Funcionou:** a função pura de validação permitiu testar limites (por exemplo, exatamente R$ 15.000 não exige aprovação; confiança exatamente 0,70 passa).
- **Não funcionou:** os casos de teste da extração não incluíam saudação na mesma linha do pedido ("Bom dia, preciso de …"); o defeito apareceu ao testar o endpoint à mão e na carga da [Sprint 5](sprint-5-concorrencia-e-carga.md).
- **Ação:** ampliar os casos adversariais do extrator com os formatos que o gerador produz.
