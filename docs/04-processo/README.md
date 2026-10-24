# Episódio 4 — Processo

O fluxo do n8n recebe a mensagem, tenta enviar ao Fluxo três vezes e, se falhar, avisa a equipe. A versão 2.44.6 do n8n tem uma armadilha de ativação, descrita no passo a passo.

A medição rodou 500 mensagens do gerador. A primeira execução acertou 491 de 500: cinco pedidos corretos terminaram em `PROCESSING_FAILED` por deadlock. A correção (ordem estável de bloqueios e retentativa) está no commit `2f2ef7b`. A execução final acertou 500 de 500: 333 registrados direto, 41 duplicatas barradas, mediana de 95,4 ms, p95 de 152,1 ms, 78,7 mensagens por segundo e taxa de revisão de 27,5%.

As duas execuções ficaram no repositório. O relatório separa o que foi medido no sistema da estimativa de ganho de tempo.

| Documento | O que contém | Itens |
|---|---|---|
| [n8n: como rodar](n8n-como-rodar.md) | Passo a passo, armadilha da versão 2.44.6 e decisão sobre o alerta | 1 fluxo, 3 cenários testados |
| [Relatório de medição](relatorio-de-medicao.md) | Carga de 500 mensagens, o deadlock e a estimativa de ganho | 2 execuções |
| [`medicao-resultados-run1.json`](medicao-resultados-run1.json) | Dados brutos da primeira execução, com o defeito | 500 mensagens |
| [`medicao-resultados.json`](medicao-resultados.json) | Dados brutos da execução final | 500 mensagens |

← [Anterior](../03-arquitetura/README.md) · [Índice](../INDEX.md) · [Próximo](../05-qualidade/README.md) →

---
