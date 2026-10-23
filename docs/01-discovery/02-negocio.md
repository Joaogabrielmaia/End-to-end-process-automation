# 02 · O negócio: o dia de quem lança pedidos

> Simulação: o Claude interpretou o cliente nesta conversa.
> Tudo o que está aqui é fictício e foi construído por mim para o estudo.

## A empresa
**Distribuidora Santa Clara** (fictícia): distribuidora de materiais elétricos, 15 pessoas.
- 4 no comercial (1 gerente, 3 atendentes/assistentes de vendas)
- 3 no estoque e expedição
- 2 no financeiro
- 2 em compras
- 4 em apoio (administração, TI terceirizada, motoristas)

Clientes: instaladores, pequenas construtoras e lojas de bairro. Mais ou menos **80 pedidos por dia** chegam por e-mail, e hoje cada um é lançado **à mão** numa planilha compartilhada.

## O dia de quem lança pedidos

| Horário | O que acontece |
|---|---|
| 07:30 | Abre a caixa `pedidos@santaclara.example`. Em média 20 e-mails acumulados da noite. |
| 08:00–10:00 | **Pico da manhã.** Instaladores mandam pedido antes de ir para a obra. Chegam de 3 a 5 e-mails por minuto em alguns intervalos. |
| 10:00–12:00 | Fluxo normal. Muito tempo gasto procurando código de produto e conferindo estoque na outra planilha. |
| 12:00–14:00 | Almoço revezado. Pedidos se acumulam. |
| 14:00–16:00 | **Segundo pico**, menor, de lojas que fecham pedido da tarde. |
| 16:00–17:30 | Fechamento: conferir o que ficou sem lançar, avisar a expedição do que sai no dia seguinte. |

## Erros comuns (relatados nas conversas simuladas)
1. **Código de produto trocado** (ex.: disjuntor de 20 A lançado como de 25 A).
2. **Quantidade digitada errada** (200 em vez de 20; dedo no teclado).
3. **Cliente errado**, principalmente quando há empresas com nomes parecidos.
4. **Estoque não conferido**: o pedido é lançado e só depois descobrem que não tem.
5. **Limite de crédito esquecido**: o financeiro percebe só no faturamento.
6. **Pedido duplicado**: o cliente reenvia o e-mail por impaciência e o pedido é lançado duas vezes.
7. **Pedido perdido**: e-mail fica enterrado no pico e só reaparece quando o cliente liga.

## Picos
- Segunda-feira de manhã (acumulado do fim de semana).
- Dias 5 e 20 (final de ciclo de pagamento das obras).
- Véspera de feriado.

## Consequências
- Retrabalho do estoque (separar o que não existe).
- Cliente ligando para saber se o pedido "entrou".
- Tempo do gerente gasto em apagar incêndio.

## O que isso me diz para o projeto
- O ganho principal está em **ler, identificar e conferir**, não em digitar.
- O pico de manhã exige que a automação não dependa de uma pessoa estar olhando.
- Duplicidade e perda têm solução de engenharia (idempotência, persistir antes de processar) e eu devo mostrá-la.
