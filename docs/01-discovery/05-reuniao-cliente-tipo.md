# 05 · Reunião 3 — Cliente-tipo

> Simulação: o Claude interpretou o cliente nesta conversa.

- **Participantes (fictícios):** Antônio Pinheiro (dono da Elétrica Pinheiro Ltda, instalador, compra quase toda semana) e eu (João).
- **Objetivo:** entender a perspectiva de quem manda os pedidos.

## Conversa resumida

**Eu:** Como o senhor faz um pedido?
**Antônio:** Escrevo no celular, tipo "preciso de 20 disjuntor 20A, 5 rolos de cabo 2,5, uns 10 tomada". E mando por e-mail porque o WhatsApp deles enche.

**Eu:** E a planilha padrão?
**Antônio:** Uso quando é pedido grande. Pequeno eu escrevo mesmo.

**Eu:** O que o incomoda?
**Antônio:** Não saber se entrou. Já mandei e depois liguei duas vezes. E às vezes mando de novo porque acho que se perdeu.

**Eu:** Reenvio é um problema?
**Antônio:** Para mim não. Para eles, sei que dá pedido duplicado.

**Eu:** Se faltar um item?
**Antônio:** Quero saber na hora, não na entrega.

**Eu:** Já mandou foto de lista escrita à mão?
**Antônio:** Já. Mas não quero depender disso.

## Pedidos refinados
| Pedido do cliente | Como eu refinei | Destino |
|---|---|---|
| "Saber se entrou" | Confirmação de recebimento com número do pedido | **Could**: canal simulado cobre equipe interna no MVP; e-mail de confirmação ao cliente fica no roadmap |
| "Mandar de novo sem medo" | Idempotência por identificador da mensagem | **Must** (RN-10) |
| "Saber na hora se falta" | Item sem estoque vira exceção imediata com motivo | **Must** (RN-06) |
| "Foto de lista à mão" | Exige OCR/visão | **Won't** nesta versão |

## O que mudou no projeto
- Texto livre informal, com quantidade antes do nome e sem unidade ("20 disjuntor 20A"), é caso de teste obrigatório do extrator.
- Linguagem do cliente tem plural/singular misturado ("tomada", "tomadas"). O extrator normaliza.
- Entrada por imagem foi explicitamente recusada para o MVP.
