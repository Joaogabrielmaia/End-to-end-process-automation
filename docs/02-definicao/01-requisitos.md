# 01 · Requisitos

## Requisitos funcionais (RF)

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Receber um pedido por um endpoint que simula a caixa de e-mail (remetente, assunto, corpo, anexo opcional, identificador da mensagem) | Must |
| RF-02 | Ignorar mensagens repetidas (idempotência pelo identificador da mensagem; fallback por hash do conteúdo) | Must |
| RF-03 | Extrair cliente, itens, quantidades e prazo de texto livre, tabela e PDF simples | Must |
| RF-04 | Validar: cliente cadastrado, SKU, quantidade, limite de crédito, estoque, alçada e prazo | Must |
| RF-05 | Registrar o pedido válido reservando estoque e crédito de forma atômica | Must |
| RF-06 | Notificar a equipe por um canal simulado com adaptador trocável | Must |
| RF-07 | Enviar para uma fila de exceções o que precisa de decisão, com motivo legível | Must |
| RF-08 | Permitir corrigir dados e reprocessar a partir da fila | Must |
| RF-09 | Permitir aprovação humana de exceção de crédito e de alçada, com justificativa | Should |
| RF-10 | Registrar auditoria de tudo o que a automação e as pessoas decidiram | Must |
| RF-11 | Repetir tentativas em falhas transitórias e expor a falha esgotada | Should |
| RF-12 | Painel: pedidos por status, tempo médio entre entrada e registro, taxa de revisão e motivos de exceção | Must |
| RF-13 | Cadastros de clientes e produtos com seed realista (consulta no painel) | Should |
| RF-14 | Gerador de pedidos de exemplo em vários formatos | Should |
| RF-15 | Exportar dados em CSV (apoio ao Power BI) | Could |
| RF-16 | (v1.1) Alertar exceções paradas além de um limite de horas | Could |

## Requisitos não funcionais (RNF)

| ID | Requisito | Como verifico |
|---|---|---|
| RNF-01 | Desempenho: o processamento automático de um pedido não depende de pessoa, e a latência é medida | Teste de carga (500 pedidos) |
| RNF-02 | Confiabilidade: a mensagem é persistida antes de processar; nenhum pedido se perde numa falha | Teste de integração com falha injetada |
| RNF-03 | Auditabilidade: toda decisão automática tem evento com motivo | Teste de integração + tela de detalhe |
| RNF-04 | Manutenibilidade: extração, notificação e armazenamento atrás de interfaces | Revisão de código + testes com provedor determinístico |
| RNF-05 | Testabilidade: regras de negócio são funções puras testáveis sem banco | Testes unitários |
| RNF-06 | Segurança: endpoint de entrada exige chave; sem segredos no repositório | Teste de integração + revisão |
| RNF-07 | Portabilidade: sobe local com Docker Compose | Execução real documentada |
| RNF-08 | Usabilidade: interface em português, exceções com motivo em linguagem de negócio | Reunião de aceitação (simulada) |
