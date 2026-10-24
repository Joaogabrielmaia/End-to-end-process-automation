# Registros de decisão de arquitetura (ADRs)

Formato de cada decisão: **contexto → alternativas → escolha → motivo → trade-off → quando eu mudaria de ideia.**

---

## ADR-001 · n8n ou código puro?

**Contexto:** preciso de orquestração visível (quem lê o repositório precisa enxergar o fluxo) e de regras de negócio testáveis.

**Alternativas:**
1. Tudo no n8n (nós de código e IF para as regras).
2. Tudo em código (job/worker em Node), sem n8n.
3. Híbrido: n8n orquestra; código tem as regras.

**Escolha:** 3, híbrido.

**Motivo:** regras (RN-02 a RN-09) precisam de teste unitário, versionamento em diff legível e tipos. Em n8n elas viram JSON de nós difíceis de revisar. Já a orquestração (gatilho, retentativa, roteamento por resultado, agendamento do alerta de exceção parada) é onde o n8n se encaixa.

**Trade-off:** duas peças para operar, e o pipeline também roda sem o n8n (o endpoint `/api/inbound` faz tudo). Isso significa que o n8n não é um requisito para o sistema funcionar; ele adiciona recebimento com retentativa, alerta e roteamento. Eu aceito essa duplicidade de "entrada" porque ela permite testar tudo sem o n8n.

**Quando eu mudaria:** se a equipe fosse não técnica e as regras mudassem toda semana, eu levaria mais regras para o n8n com uma tabela de configuração. Se o volume crescesse muito (milhares por minuto), eu trocaria o n8n por uma fila (SQS/RabbitMQ) e workers.

---

## ADR-002 · Onde fica cada regra

**Contexto:** a mesma regra pode viver na extração, na validação, no banco ou na tela.

**Alternativas:** (a) tudo na validação; (b) distribuir por camada; (c) validação como função pura, mais restrições no banco como rede de segurança.

**Escolha:** (c).

| Camada | O que fica lá |
|---|---|
| Extração | Só interpretar texto → rascunho com confiança. Sem regra de negócio |
| Validação (`validation.ts`, função pura) | RN-01 a RN-09 |
| Pipeline (`pipeline.ts`) | Orquestração, idempotência, retentativa, transação de registro (RN-10 a RN-12) |
| Banco | Unicidade do `messageId`, chaves estrangeiras, estoque nunca negativo (CHECK) |
| Tela | Apresentação; nada de regra |

**Motivo:** função pura se testa sem banco e sem rede (RNF-05). As restrições do banco impedem que um bug no código gere dados impossíveis.

**Trade-off:** a validação lê dados já carregados (clientes, produtos), então o pipeline precisa carregá-los antes. Mais código de "montagem" no pipeline.

**Quando eu mudaria:** se as regras virassem configuráveis por cliente, eu moveria os parâmetros (limite, alçada) para o banco e deixaria a função receber a configuração.

---

## ADR-003 · Idempotência pelo identificador da mensagem

**Contexto:** o cliente reenvia e-mail; o gatilho pode disparar duas vezes; a retentativa reprocessa.

**Alternativas:** (a) deduplicar por cliente+itens+janela de tempo; (b) por hash do conteúdo; (c) por `Message-ID` do e-mail; (d) combinação: (c) com fallback (b).

**Escolha:** (d).

**Motivo:** `Message-ID` identifica a *mensagem* de forma exata; um reenvio manual tem outro `Message-ID` e, nesse caso, o hash do conteúdo (remetente + assunto + corpo normalizado) o captura. Deduplicar por regra de negócio (a) esconderia pedidos legítimos repetidos (duas compras iguais no mesmo dia).

**Mecanismo:** coluna `messageId` com `UNIQUE`. O código tenta inserir; se a inserção viola a unicidade, é duplicata. Isso é seguro sob concorrência, ao contrário de "consultar antes, inserir depois".

**Trade-off:** um cliente que reenvia o mesmo texto de propósito para fazer o mesmo pedido de novo será tratado como duplicata (hash igual). Mitigação: o hash inclui o `Date` do e-mail; se o cliente quiser repetir, o e-mail novo tem data nova. Mesmo assim, um falso positivo cria um registro `DUPLICATE` visível na auditoria, e não some em silêncio.

**Quando eu mudaria:** com EDI ou número de pedido do cliente, eu usaria esse número como chave de idempotência.

**Nota de revisão (24/10/2026):** o código de `src/lib/pipeline.ts` calcula o hash com remetente, assunto e corpo normalizados e o anexo, sem o `Date` do e-mail, e compara com as mensagens das últimas 24 horas. A mitigação citada acima (hash com `Date`) não corresponde à implementação; na prática, o mesmo texto reenviado dentro de 24 horas é tratado como duplicata, e o registro `DUPLICATE` fica visível na auditoria.

---

## ADR-004 · Extração por regra ou por LLM

**Contexto:** formatos variados. Texto livre informal é o mais difícil.

**Alternativas:** (a) só regras e expressões regulares; (b) só LLM; (c) regras primeiro, LLM como alternativa para texto livre duvidoso, atrás de uma interface.

**Escolha:** (c), com interface `ExtractionProvider` e provedor determinístico para testes. **O padrão do projeto é só regras.**

**Motivo:** regras são rápidas, gratuitas, auditáveis e determinísticas; o LLM cobre o que as regras não pegam. A interface isola a escolha: para testes uso `FixtureExtractionProvider` (resposta fixa por mensagem), para produção local `RulesExtractionProvider`, e `LlmExtractionProvider` quando houver chave.

**Importante (honestidade):** o `LlmExtractionProvider` está implementado e coberto por teste com `fetch` simulado, mas **não foi executado contra a API real neste estudo**. A saída do LLM passa pela **mesma validação** e pelo mesmo limiar de confiança que a das regras.

**Trade-off:** a manutenção das regras de extração (aliases de produtos, formatos) é manual. O LLM reduziria isso, ao custo de latência, de gasto e de enviar texto de cliente para terceiros.

**Quando eu mudaria:** se a taxa de `LOW_CONFIDENCE` ficasse alta e dominante no painel, eu promoveria o LLM a primeiro passo para texto livre, com avaliação em conjunto de teste rotulado.

---

## ADR-005 · Como tratar exceções

**Contexto:** "prefiro que pergunte" (Ricardo). A automação nunca deve adivinhar em silêncio.

**Alternativas:** (a) rejeitar e devolver ao cliente; (b) registrar com flag "revisar"; (c) fila de exceções separada do pedido válido.

**Escolha:** (c). O pedido é criado com status `EXCEPTION` e uma `ExceptionCase` guarda **todas** as pendências (código, detalhe, item).

**Motivo:** a fila é a interface entre automação e pessoa. Mantém pedidos válidos limpos, dá métricas por motivo e permite correção com reprocessamento revalidando tudo.

**Regra de ouro:** corrigir **não** pula validação. A correção altera o rascunho e roda a validação de novo; só vira `REGISTERED` se passar (ou se uma aprovação humana explícita cobrir crédito/alçada).

**Trade-off:** mais telas e estados. E o risco de a fila ficar esquecida, mitigado pela idade no painel e pelo alerta da v1.1.

**Quando eu mudaria:** se a maioria das exceções fosse de um único tipo trivial (ex.: prazo ausente), eu automatizaria o tratamento daquele tipo.

---

## ADR-006 · Auditoria

**Contexto:** quem decidiu o quê? Marlene quer saber, e a automação precisa ser explicável.

**Alternativas:** (a) log de aplicação; (b) colunas "atualizado por"; (c) tabela de eventos append-only.

**Escolha:** (c), `AuditEvent`, com ator (`AUTOMATION` ou `USER`), tipo, descrição legível e dados em JSON.

**Motivo:** log de aplicação se perde e não é consultável pelo negócio; colunas só guardam o último estado. Eventos reconstroem a história inteira, inclusive "o que mudou" em uma correção (antes/depois).

**Trade-off:** crescimento da tabela e custo de escrita extra por pedido. Aceitável neste volume (80 por dia).

**Quando eu mudaria:** em escala maior, eu particionaria por mês e arquivaria.

---

## ADR-007 · Notificação com adaptador trocável

**Contexto:** a equipe precisa saber quando um pedido entra; o canal real (chat, e-mail) é outro assunto.

**Escolha:** interface `Notifier` com dois adaptadores: `SimulatedNotifier` (grava em tabela `Notification`, padrão) e `WebhookNotifier` (POST em URL configurada). Só o simulado é exercitado nos testes; o de webhook tem teste com `fetch` simulado.

**Trade-off:** o canal "simulado" não prova entrega real. Isso é dito na documentação.

**Quando eu mudaria:** ao escolher o canal real da equipe, escreveria um adaptador novo sem tocar no pipeline.
