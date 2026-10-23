# Resultados de testes

> Tudo aqui vem de execuções reais feitas em 23/10/2026 na minha máquina (Windows 11, Docker Desktop, Postgres 16 local, n8n 2.44.6). O caso é fictício; não há cliente nem operação real.

## Resumo

| Camada | Comando | Resultado |
|---|---|---|
| Tipos | `npm run typecheck` | sem erros |
| Unitários e integração | `npm test` | 76 de 76 passaram (8 arquivos) |
| Ponta a ponta (navegador) | `npm run test:e2e` | 5 de 5 passaram |
| Fluxo n8n | execução manual, 3 cenários | 3 de 3 se comportaram como esperado |
| Carga | `npm run load` (500 mensagens, semente 42, concorrência 8) | 500 de 500 com o resultado esperado |

Os testes de integração rodam em um banco separado (`fluxo_test`) para não apagar os dados do painel.

## O que cada camada cobre

- **Unitários** (`tests/unit`): dias úteis e prazo, estimativa de ganho de tempo, extração por regras, gerador de pedidos, retentativa e as regras de validação (RN-02 a RN-09).
- **Integração** (`tests/integration/pipeline.test.ts`): ingestão → extração → validação → registro → notificação, idempotência, reserva de estoque, consumo de crédito, correção e reprocessamento (HU-01 a HU-06).
- **Integração da rota de alerta** (`tests/integration/notify-route.test.ts`, 4 testes): `/api/notify` grava no canal `integracao` com o destinatário padrão, rejeita chave ausente, errada ou não configurada sem gravar nada, e valida o formato (assunto obrigatório, JSON legível). Cobre RNF-06.
- **E2E** (`tests/e2e/flow.spec.ts`, 5 testes): fluxo completo (registrado, texto livre, exceção, duplicata, correção com SKU ainda inválido e depois válido, trilha de auditoria, painel e fila), aprovação de crédito com justificativa obrigatória, chave de API e validação do endpoint de entrada, layout móvel de 390 px sem rolagem horizontal, exportação CSV.

## Fluxo n8n (`automations/fluxo-recebimento-de-pedidos.json`)

Importei o JSON no n8n 2.44.6 do `docker-compose.yml`, ativei o fluxo e disparei o webhook `POST /webhook/fluxo/pedido-recebido` com o app rodando em `localhost:3100`.

| Cenário | Entrada | Resultado observado |
|---|---|---|
| Pedido válido | tabela com `DJM-020` × 5 | `status: registered`, pedido `PED-000969`, notificação em `#pedidos` gravada |
| Reenvio do mesmo e-mail | mesma `messageId` e mesmo corpo | `status: duplicate` com o mesmo `orderId`; nenhum pedido novo |
| Falha de integração | `from` inválido, que o `/api/inbound` rejeita com 400 | o nó de envio tentou 3 vezes (2 s entre tentativas, 4 s no total), o ramo de erro chamou `/api/notify` e a notificação `Fluxo indisponível: pedido não entregue` foi gravada em `#alertas-de-integracao` |

Todas as execuções do fluxo listadas pelo n8n (os 3 cenários acima mais as sondas que usei para confirmar o webhook) terminaram com status `success`.

**Limite desse teste.** A falha foi provocada com um 400, não com o app fora do ar. Se o app estiver totalmente indisponível, o alerta também falha, porque ele passa pelo mesmo app (`/api/notify`). O desenho atual cobre "o Fluxo rejeitou ou falhou", não "o Fluxo está fora". Para cobrir o segundo caso, o alerta teria de sair por um canal independente do app (e-mail ou chat direto do n8n). Fica como melhoria, não como algo feito.

Como reproduzir está em `docs/04-processo/n8n-como-rodar.md`.

## Carga (500 mensagens)

Fonte: `docs/04-processo/medicao-resultados.json` (execução final) e `medicao-resultados-run1.json` (primeira execução).

| Métrica | Execução 1 (com defeito) | Execução final |
|---|---|---|
| Mensagens com resultado esperado | 491 de 500 | 500 de 500 |
| `PROCESSING_FAILED` | 5 | 0 |
| Vazão | 46,0 mensagens/s | 78,7 mensagens/s |
| Latência da requisição, p50 | 95,4 ms | 95,4 ms |
| Latência da requisição, p95 | 1010 ms | 152 ms |
| Latência da requisição, máx. | 2115 ms | 323,5 ms |
| Processamento automático, p95 (banco) | 63 ms | 64,8 ms |
| Taxa de revisão | 29,2% | 27,5% |

A execução 1 expôs um defeito real: sob concorrência 8, transações travavam uma à outra (deadlock) e 5 pedidos limpos terminaram em `PROCESSING_FAILED`. A correção foi uma ordem estável de bloqueios e tratar deadlock como falha transitória com retentativa (RN-11, RN-12), no commit `2f2ef7b`. Mantive a execução 1 no repositório de propósito.

A taxa de revisão de 27,5% **não** é uma previsão para uma operação real: ela vem do gerador, cuja mistura de cenários (pedidos com erro, duplicatas, estoque curto) eu defini. Ela mede o comportamento do sistema contra essa mistura.

## O que ainda não foi verificado

- **RNF-08 (usabilidade):** a reunião de aceitação simulada não aconteceu; só medi layout móvel.
- **RNF-07 (portabilidade):** subi `db` e `n8n` com Docker Compose; o perfil `app` (painel em contêiner) não foi executado.
- **Caixa de e-mail real:** o webhook simula a caixa. O nó "Email Trigger (IMAP)" não foi testado.
- **Provedor LLM (`rules+llm`) e notificação por webhook externo:** não executados; os testes usam o provedor determinístico e o canal simulado.
- **Acessibilidade:** não rodei auditoria automática (axe) nem teste com leitor de tela.
