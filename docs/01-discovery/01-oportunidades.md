# 01 · Oportunidades de automação e matriz de decisão

> Reunião simulada; pessoas e empresa fictícias.
> (A matriz abaixo é análise minha. As notas de 1 a 5 são palpites informados a partir do briefing do caso e das conversas simuladas, não medições.)

## Contexto
A Distribuidora Santa Clara tem 15 pessoas e vende materiais elétricos para instaladores e pequenas obras. Antes de escolher o que automatizar, fiz um brainstorm de cinco oportunidades que aparecem em qualquer distribuidora desse porte.

## As 5 oportunidades

| # | Oportunidade | Descrição curta |
|---|---|---|
| A | **Pedidos por e-mail** | Ler o e-mail do cliente, extrair itens, validar e lançar no controle interno |
| B | **Cobrança** | Régua de cobrança de títulos vencidos (lembrete, segunda via, escalonamento) |
| C | **Conferência de estoque** | Cruzar contagem física com a planilha e apontar divergências |
| D | **Cotação** | Responder pedidos de preço com tabela vigente e prazo |
| E | **Relatórios gerenciais** | Consolidar vendas semanais para a gerência |

## Critérios e pesos

Cada critério vai de 1 a 5.

| Critério | Sentido | Peso |
|---|---|---|
| Frequência (quantas vezes por dia/semana acontece) | maior é melhor | 0,25 |
| Volume (quantas pessoas/horas toca) | maior é melhor | 0,25 |
| Erro (quanto o erro manual custa hoje) | maior é melhor | 0,20 |
| Esforço (para automatizar) | maior é pior → entra como `6 − esforço` | 0,15 |
| Risco (de automatizar errado) | maior é pior → entra como `6 − risco` | 0,15 |

Fórmula: `nota = 0,25·F + 0,25·V + 0,20·E + 0,15·(6 − Esforço) + 0,15·(6 − Risco)`

## Matriz

| Oportunidade | F | V | E | Esforço | Risco | **Nota** |
|---|---|---|---|---|---|---|
| A · Pedidos por e-mail | 5 | 5 | 4 | 3 | 2 | **4,35** |
| D · Cotação | 4 | 4 | 3 | 4 | 2 | 3,50 |
| C · Conferência de estoque | 4 | 3 | 4 | 4 | 3 | 3,30 |
| B · Cobrança | 3 | 3 | 3 | 2 | 4 | 3,00 |
| E · Relatórios | 2 | 2 | 2 | 2 | 1 | 2,75 |

## Decisão

**Contexto:** só dá para construir uma automação bem feita, com medição e tratamento de falhas, no tempo de um estudo de caso.

**Alternativas:** as cinco acima.

**Escolha:** A, pedidos por e-mail.

**Motivo:** é a única que combina alta frequência, alto volume e erro caro (pedido errado vira entrega errada), e o risco é controlável porque dá para colocar uma fila de exceções entre a automação e o lançamento. Também é a que melhor mostra o ciclo completo: entrada, regra, exceção, auditoria e painel.

**Trade-off:** pedido é o fluxo mais "sujo" (formatos variados). Cotação seria mais fácil de entregar rápido. Eu aceito o custo de uma entrega mais lenta.

**Quando eu mudaria de ideia:** se o volume de pedidos fosse baixo (menos de 20 por dia) ou se a distribuidora já tivesse EDI com os clientes. Aí a cotação ou a conferência de estoque, que têm esforço parecido, passariam na frente.

**Sensibilidade:** se eu dobrar o peso de esforço e risco (0,30 cada, reduzindo F e V para 0,15), A continua em primeiro lugar (4,40), seguida de E (3,70), D (3,60), C (3,35) e B (3,30). A ordem do resto muda bastante, mas a escolha de A não depende de um único peso.

Cálculo conferido para A com os pesos da tabela: `1,25 + 1,25 + 0,80 + 0,45 + 0,60 = 4,35`.
