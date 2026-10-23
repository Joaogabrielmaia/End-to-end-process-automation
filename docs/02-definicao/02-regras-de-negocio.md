# 02 · Regras de negócio

Cada regra tem um ID, um código de exceção quando falha e a origem na descoberta.

| ID | Regra | Falha gera | Origem |
|---|---|---|---|
| RN-01 | **Pedido válido:** cliente cadastrado e ativo, pelo menos um item, todos os itens com SKU ativo, quantidades válidas e prazo válido | `EMPTY_ORDER` (sem itens) | Reunião 2 |
| RN-02 | **Identificação do cliente:** por CNPJ no texto; se não houver, pelo e-mail do remetente cadastrado | `CUSTOMER_NOT_FOUND` | Reunião 2 |
| RN-03 | **SKU:** todo item precisa existir no cadastro e estar ativo | `UNKNOWN_SKU` | Reunião 2 |
| RN-04 | **Quantidade:** inteira, maior que 0 e no máximo 5.000 por linha | `INVALID_QUANTITY` | Dia a dia (erro de digitação) |
| RN-05 | **Crédito:** `crédito usado + total do pedido ≤ limite`. Se não, bloqueia; um humano pode aprovar com justificativa | `CREDIT_LIMIT_EXCEEDED` | Reuniões 1 e 2 |
| RN-06 | **Estoque:** quantidade pedida ≤ estoque disponível, por item. Sem atendimento parcial automático | `OUT_OF_STOCK` | Reuniões 1 e 3 |
| RN-07 | **Alçada:** total acima de R$ 15.000,00 vai sempre para revisão e exige aprovação humana | `HIGH_VALUE_APPROVAL` | Reunião 1 |
| RN-08 | **Prazo:** ausente → 2 dias úteis a partir do recebimento (com registro na auditoria); data anterior à de recebimento → inválido | `INVALID_DEADLINE` | Reunião 2 |
| RN-09 | **Confiança da extração:** abaixo de 0,70, vai para revisão | `LOW_CONFIDENCE` | Reuniões 1 e 2 |
| RN-10 | **Idempotência:** mesma mensagem (mesmo identificador, ou mesmo conteúdo na ausência dele) não gera um segundo pedido | — (registrado como duplicata) | Reunião 3 |
| RN-11 | **Registro atômico:** registrar o pedido, reservar estoque e consumir crédito numa só transação | — | Engenharia |
| RN-12 | **Retentativa:** falhas transitórias têm até 3 tentativas com espera crescente; esgotadas, o pedido vai para a fila | `PROCESSING_FAILED` | Engenharia |
| RN-13 | **Exceção parada:** exceção aberta há mais de N horas (padrão 4) gera alerta (v1.1) | — | Reunião 1 |

## O que é "pedido válido", em resumo
Passou em RN-01 a RN-09 sem exceção aberta. Só então vira `REGISTERED`.

## Quando vai para revisão
Qualquer falha de RN-01 a RN-09 e RN-12. Podem acontecer várias ao mesmo tempo: a exceção guarda **todas** as pendências, e o motivo principal é o de maior prioridade (ordem: cliente → itens → quantidade → estoque → crédito → alçada → prazo → confiança).

## Premissas de dados (por causa do ERP fechado)
Estoque e crédito usado são carregados no Fluxo por seed/CSV, como se viessem da exportação matinal. Não há sincronização com ERP.

## Limitações assumidas
- Dias úteis ignoram feriados.
- Preço é o de tabela único (sem desconto por cliente).
- Moeda: reais, sem impostos.
