# Sobre este caso

Fluxo é uma automação que recebe pedidos enviados por e-mail, extrai os dados, valida regras de negócio, registra tudo em um banco, avisa a equipe e alimenta um painel. O que precisa de decisão humana cai numa **fila de exceções**, com o motivo e um botão de correção e reprocessamento.

O que eu quis mostrar não é só a automação, e sim o processo **antes e depois**, a medição **honesta** e o que acontece **quando algo dá errado**.

## A empresa do caso

A "Distribuidora Santa Clara" é uma distribuidora de materiais elétricos com 15 pessoas e cerca de 80 pedidos por dia por e-mail. Eu a criei para este estudo. Os CNPJs e telefones usam sequências claramente falsas e os e-mails usam o domínio reservado `.example`.

## Real × simulado

| O quê | Situação |
|---|---|
| Empresa, pessoas, clientes, produtos, CNPJs e telefones | Fictícios |
| Discovery | Três reuniões simuladas (gerente comercial, quem lança os pedidos, cliente-tipo); não há registro de aceitação nem de retrospectiva |
| Tempos do processo atual (AS-IS) | Estimativas de um personagem simulado; nenhuma medição real |
| Ganho de tempo | Estimativa, com fórmula e entradas visíveis em [`relatorio-de-medicao.md`](../04-processo/relatorio-de-medicao.md) |
| Testes e carga | Execuções reais, com data e commit em [`05-qualidade`](../05-qualidade/) e [`04-processo`](../04-processo/relatorio-de-medicao.md) |

Tudo roda local, com Docker Compose. Não há hospedagem nem link de demonstração.

## Como ler a documentação

Comece pelo [`docs/INDEX.md`](../INDEX.md), que tem trilhas de 2, 10 e 30 minutos, ou pelo [README principal](../../README.md). Os termos técnicos estão no [glossário](../GLOSSARIO.md).
