# 04 · Reunião 2 · Quem lança os pedidos

> Reunião simulada; pessoas e empresa fictícias.

- **Participantes (fictícios):** Ricardo Teixeira (assistente de vendas, lança pedidos há 4 anos) e eu (João).
- **Objetivo:** entender o trabalho real, os tempos e as exceções.

## Conversa resumida

**Eu:** A Marlene disse que quase todos os pedidos vêm na planilha padrão.
**Ricardo:** *(rindo)* Metade. A outra metade é texto colado do WhatsApp dentro do e-mail, e uns 10% vêm em PDF que o cliente gera de um sistema dele. *(contradição com a reunião 1)*

**Eu:** Quanto tempo você leva por pedido?
**Ricardo:** Uns 8 minutos em média. Pedido pequeno, 4. Pedido grande, até 20.

**Eu:** Onde o tempo vai?
**Ricardo:** Ler e entender, achar o cliente, achar o código dos itens, olhar estoque, olhar crédito, digitar, e avisar o pessoal da expedição.

**Eu:** O que mais dá erro?
**Ricardo:** Código parecido. Disjuntor 20 A e 25 A. E o cliente esquece de escrever o CNPJ, mas eu conheço pelo e-mail.

**Eu:** E o limite de crédito?
**Ricardo:** A Marlene fala que é sempre respeitado, mas às vezes o cliente é antigo, passou um pouco, e ela me libera por telefone. Eu lanço e anoto na planilha. *(contradição com a reunião 1)*

**Eu:** E sem prazo?
**Ricardo:** Se o cliente não fala, eu considero 2 dias úteis.

**Eu:** Se eu fizer o sistema, o que seria o pior que ele pode fazer?
**Ricardo:** Lançar errado sem avisar. Prefiro que pergunte.

**Eu:** E a restrição de integração?
**Ricardo:** O ERP é fechado, quem mantém é um terceiro e ele não vai abrir banco nem API. A gente exporta CSV de saldo de crédito e de estoque toda manhã. *(restrição que muda o escopo)*

## Pedidos vagos que eu refinei

| O que ele disse | Como eu refinei | Vira |
|---|---|---|
| "Prefiro que pergunte" | Toda dúvida cai numa fila com o motivo; nada de adivinhar silenciosamente. | RF-07, RN-09 |
| "Conheço pelo e-mail" | Identifico por CNPJ no texto; se não houver, pelo e-mail do remetente cadastrado. | RN-02 |
| "Considero 2 dias úteis" | Prazo ausente = 2 dias úteis, com registro na auditoria de que foi um padrão assumido. | RN-08 |

## Decisões e mudanças de escopo
1. **Restrição de ERP fechado:** não vou integrar com ERP. O Fluxo mantém seu próprio cadastro, alimentado por seed/CSV (estoque e crédito importados). ERP real fica **fora do escopo** (já estava) e a importação diária de saldo vira premissa. *(muda o escopo)*
2. **Crédito:** estourar o limite é exceção **aprovável** por humano, com justificativa registrada. Resolve a contradição: a regra é "bloqueia por padrão, libera com aprovação auditada". (RF-09, RN-05)
3. **Formatos:** o MVP precisa tratar texto livre, tabela e PDF simples. (RF-03)

## Medições que ele concordou em fazer
Ricardo topou cronometrar 20 pedidos reais durante uma semana (ver método em [06-processo-atual-as-is.md](06-processo-atual-as-is.md)). Isso é um **plano**; nenhuma medição real existe neste repositório.
