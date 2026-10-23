# 03 · Histórias de usuário, critérios de aceite e MoSCoW

Personas (fictícias): **Ricardo** (assistente de vendas), **Marlene** (gerente comercial), **Antônio** (cliente).

| ID | História | Critérios de aceite | RF/RN | MoSCoW |
|---|---|---|---|---|
| HU-01 | Como Ricardo, quero que o pedido enviado por e-mail entre sozinho no sistema, para não precisar lançar à mão | **Dado** um e-mail bem formatado de cliente cadastrado, com itens em estoque e dentro do crédito, **quando** ele chega, **então** o pedido fica `REGISTERED` sem intervenção e a equipe é notificada | RF-01, RF-05, RF-06 | Must |
| HU-02 | Como Antônio, quero escrever o pedido em texto livre, para não depender de planilha | **Dado** "20 disjuntor 20A, 5 rolos de cabo 2,5mm", **então** o extrator identifica itens e quantidades; **dado** frase sem itens reconhecíveis, **então** vai para revisão | RF-03, RN-09 | Must |
| HU-03 | Como Ricardo, quero que a validação confira cliente, SKU, quantidade, estoque e crédito, para eu parar de abrir planilhas | Cada regra RN-02 a RN-07 tem um caso de teste que gera o código de exceção esperado | RF-04, RN-02..09 | Must |
| HU-04 | Como Antônio, quero reenviar o e-mail sem gerar pedido em dobro | **Dado** o mesmo identificador de mensagem duas vezes, **então** só um pedido existe e o segundo envio é registrado como duplicata | RF-02, RN-10 | Must |
| HU-05 | Como Ricardo, quero ver numa fila o que a automação não soube resolver, com o motivo | A fila lista pedidos em exceção com motivo(s) em português, cliente, valor e idade | RF-07 | Must |
| HU-06 | Como Ricardo, quero corrigir um dado e reprocessar | Após corrigir (cliente, SKU, quantidade, prazo), o pedido é revalidado; se válido, vira `REGISTERED` e a exceção `RESOLVED`; se não, continua com os novos motivos | RF-08 | Must |
| HU-07 | Como Marlene, quero aprovar uma exceção de crédito ou de valor alto com justificativa | A aprovação exige texto, grava quem/quando/por quê e libera o registro | RF-09, RN-05, RN-07 | Should |
| HU-08 | Como Marlene, quero um painel com status, tempo de entrada ao registro, taxa de revisão e motivos | O painel mostra os quatro indicadores, calculados do banco | RF-12 | Must |
| HU-09 | Como Marlene, quero ver o que a automação decidiu e por quê | O detalhe do pedido mostra a trilha de auditoria em ordem | RF-10 | Must |
| HU-10 | Como engenheiro, quero que falhas transitórias sejam repetidas e nunca percam o pedido | Com falha injetada nas 2 primeiras tentativas, o pedido é registrado na 3ª; com falha permanente, vai para a fila `PROCESSING_FAILED` | RF-11, RN-12 | Should |
| HU-11 | Como João, quero um gerador de pedidos de exemplo, para demonstrar e testar | O gerador cria pedidos em 3 formatos e erros controlados | RF-14 | Should |
| HU-12 | Como analista, quero consultar clientes e produtos | Listagens com seed realista | RF-13 | Should |
| HU-13 | Como analista, quero exportar CSV para o Power BI | Arquivos CSV com colunas documentadas | RF-15 | Could |
| HU-14 | Como Marlene, quero ser alertada de exceções paradas (v1.1) | Exceção aberta há mais de N horas gera notificação, uma vez | RF-16, RN-13 | Could |
| HU-15 | Como Antônio, quero receber confirmação por e-mail | — | — | Won't (roadmap) |
| HU-16 | Como Antônio, quero enviar foto de lista escrita à mão | — | — | Won't |

## MoSCoW resumido
- **Must:** HU-01, 02, 03, 04, 05, 06, 08, 09
- **Should:** HU-07, 10, 11, 12
- **Could:** HU-13, 14
- **Won't (nesta versão):** HU-15, 16, ERP real, emissão de nota, roteirização, multiempresa
