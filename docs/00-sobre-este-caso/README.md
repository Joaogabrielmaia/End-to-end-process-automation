# Sobre este caso

Eu sou o João Gabriel Maia da Costa, graduando em Engenharia de Software (PUC Minas) e desenvolvedor full stack. Este repositório é meu estudo de caso para vagas de Analista de Automação, Consultor de Automação com IA e Implantação.

## O que é "Fluxo"

Fluxo é uma automação que recebe pedidos enviados por e-mail, extrai os dados, valida regras de negócio, registra tudo em um banco, avisa a equipe e alimenta um painel. O que precisa de decisão humana cai numa **fila de exceções**, com o motivo e um botão de correção e reprocessamento.

O diferencial que eu quis mostrar não é a automação em si, e sim: o processo **antes e depois**, a medição **honesta** e o que acontece **quando algo dá errado**.

## Avisos de integridade

1. **Tudo é fictício.** A "Distribuidora Santa Clara" (distribuidora de materiais elétricos, 15 pessoas, cerca de 80 pedidos por dia por e-mail) foi criada por mim para este estudo. Pessoas, clientes, produtos, CNPJs e telefones são inventados. Os CNPJs e telefones usam sequências claramente falsas e os e-mails usam o domínio reservado `.example`.
2. **As reuniões são simuladas.** Entrevistas, validações, aceitação e retrospectiva foram conduzidas com o Claude no papel do cliente e das demais pessoas. Cada registro começa com o aviso:
   > Simulação: o Claude interpretou o cliente nesta conversa.
3. **Não existe cliente real, operação real nem produção.** Não há deploy, hospedagem ou link de demonstração. Tudo roda local com Docker Compose e as provas são prints e documentos.
4. **Não há resultado inventado.** Os tempos do processo atual são *estimativas dos entrevistados* (simulados). O ganho de tempo é uma *estimativa declarada*, com fórmula e entradas visíveis. Os números de teste e de carga são de execuções reais, registradas em [`../05-qualidade`](../05-qualidade/) e [`../04-processo/relatorio-de-medicao.md`](../04-processo/relatorio-de-medicao.md).
5. **Se eu tiver uma conversa real, ela substitui a simulação.** Com autorização de quem participou, eu trocaria os arquivos de `01-discovery/` pelas anotações reais e ajustaria o README.

## Como ler a documentação

Comece pelo [`docs/INDEX.md`](../INDEX.md) ou pelo roteiro de 7 passos do [README principal](../../README.md).
