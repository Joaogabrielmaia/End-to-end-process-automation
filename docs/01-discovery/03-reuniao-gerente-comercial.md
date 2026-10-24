# 03 · Reunião 1 · Gerente comercial

> Reunião simulada; pessoas e empresa fictícias.

- **Participantes (fictícios):** Marlene Albuquerque (gerente comercial da Distribuidora Santa Clara) e eu (João).
- **Objetivo:** entender o que ela espera da automação e quais regras são dela.
- **Formato:** conversa simulada de 30 minutos, reconstruída em tópicos.

## Conversa resumida

**Eu:** Qual o maior problema hoje?
**Marlene:** Pedido errado que chega na expedição. Cada erro custa uma viagem. E eu não sei quantos pedidos estão parados.

**Eu:** Como entram os pedidos?
**Marlene:** Quase todos vêm numa planilha padrão que mandamos para os clientes. Tem coluna de código, quantidade e observação.

**Eu:** E o que você quer da automação?
**Marlene:** Quero que fique tudo automático.

**Eu:** Vou refinar isso, porque "tudo" pode significar coisas diferentes. Você quer que pedidos *corretos* nunca precisem de gente e que os *duvidosos* apareçam para alguém decidir, certo?
**Marlene:** Isso. Se estiver certo, entra sozinho. Se tiver dúvida, não pode entrar errado.

**Eu:** Sobre crédito: se o cliente passa do limite, o pedido é bloqueado?
**Marlene:** Sempre. Limite é limite.

**Eu:** E valor alto?
**Marlene:** Tudo acima de **R$ 15.000** passa por mim, sempre. Mesmo que o cliente seja bom. *(restrição que muda o escopo)*

**Eu:** E o estoque? Se faltar um item, atendemos o resto?
**Marlene:** Não decidimos pela máquina. Se falta, alguém avalia se atende parcial ou espera.

**Eu:** Quero saber quando algo está errado, como você vai ficar sabendo?
**Marlene:** Eu quero um painel, não e-mail. E quero saber se alguma coisa ficou parada.

## Pedidos vagos que eu refinei

| O que ela disse | Como eu refinei | Vira |
|---|---|---|
| "Quero tudo automático" | Pedido que passa em todas as regras entra sem toque humano. O resto vai para uma fila com motivo. | RF-04, RF-07 |
| "Quero saber se algo ficou parado" | Painel com a idade da exceção mais antiga e, depois, um alerta. | RF-12, RF-16 |
| "Não pode entrar errado" | Se a extração tiver confiança baixa, vai para revisão. | RN-09 |

## Decisões tomadas na reunião
1. Alçada: pedido acima de R$ 15.000 sempre vai para revisão. **(muda o escopo: nova regra RN-07)**
2. Estoque insuficiente nunca é atendido parcialmente pela automação. (RN-06)
3. Painel, não e-mail, como canal principal de gestão.

## Contradição que eu anotei
Marlene afirma que "limite é limite". Na reunião 2, quem lança os pedidos diz que *às vezes* libera acima do limite por telefone com ela. Vou levar isso à reunião 2 e tratar como regra com aprovação humana registrada.
