# Relatório de medição

> Dois assuntos diferentes, que eu não misturo: **(1) o que medi no sistema** com dados de exemplo e **(2) uma estimativa de ganho**, que é hipótese com entradas visíveis. O caso é fictício; não há operação real.

## 1 · Medição do sistema

Fonte: `npm run load` com 500 mensagens do gerador (semente 42, concorrência 8). Dados brutos em [`medicao-resultados.json`](medicao-resultados.json) (execução final) e [`medicao-resultados-run1.json`](medicao-resultados-run1.json) (primeira execução). A tela `/measurement` do painel lê o arquivo final.

| Métrica | Execução 1 (com defeito) | Execução final |
|---|---|---|
| Decisões iguais ao rótulo do gerador | 491 de 500 | 500 de 500 |
| `PROCESSING_FAILED` | 5 | 0 |
| Tempo total | 10,9 s | 6,4 s |
| Vazão | 46,0 mensagens/s | 78,7 mensagens/s |
| Latência da requisição (mediana / p95 / máx.) | 95,4 / 1010 / 2115 ms | 95,4 / 152 / 323,5 ms |
| Processamento automático no banco (média / p95) | 45,8 / 63 ms | 47,5 / 64,8 ms |
| Taxa de revisão no lote | 29,2% | 27,5% |

**O que a execução 1 mostrou.** Com 8 requisições simultâneas, transações travavam umas às outras e 5 pedidos corretos foram parar na fila como `PROCESSING_FAILED`. A correção foi bloquear estoque e crédito numa ordem estável e tratar deadlock como falha transitória com retentativa (RN-11, RN-12), commit `2f2ef7b`. Deixei a execução 1 no repositório de propósito: ela é a evidência de que a medição achou um defeito.

**As outras 4 divergências da execução 1.** Das 9 decisões diferentes do rótulo, 5 são os `PROCESSING_FAILED` do deadlock. As outras 4 terminaram em `UNKNOWN_SKU` (3 pedidos em texto livre que deviam ser registrados e 1 com prazo no passado que devia dar `INVALID_DEADLINE`; lista em `medicao-resultados-run1.json`). O mesmo commit `2f2ef7b` corrigiu o extrator: uma saudação na mesma linha do pedido ("Bom dia, preciso de …") descartava a linha inteira. Os totais fecham com isso: `REGISTERED` sobe de 325 para 333 (5 do deadlock mais 3 do extrator), `UNKNOWN_SKU` cai de 38 para 34 e `INVALID_DEADLINE` sobe de 6 para 7. O repositório não guarda a análise caso a caso; a correspondência vem da mensagem do commit, do diff de `src/lib/extraction/rules.ts` e dessas contagens.

**Desfechos da execução final (500 mensagens):** 333 registradas direto; 41 duplicatas ignoradas; 126 pedidos revisados por pessoa entre 459 criados; as exceções por motivo estão em `medicao-resultados.json`.

### Limites da medição
- O lote vem do **meu gerador**. A taxa de revisão de 27,5% é consequência da mistura de erros que eu defini (itens inexistentes, estoque curto, crédito, duplicatas); **não prevê** nada sobre uma operação real.
- Latência medida é a do sistema na minha máquina (banco local, sem rede entre caixa de e-mail e app). Não inclui o tempo de uma pessoa ver o pedido.
- O ganho no mundo real exigiria pilotar com pedidos reais, que não existem aqui.

## 2 · Estimativa de ganho (hipótese)

Fórmula (`src/lib/estimate.ts`):

```
pedidos_mês      = pedidos_dia × dias_úteis
min_residual     = taxa_revisão × min_por_exceção
horas_liberadas  = pedidos_mês × (min_manual − min_residual) / 60
valor            = horas_liberadas × custo_hora
```

Entradas, todas declaradas e editáveis no código:

| Entrada | Valor | Origem |
|---|---|---|
| Pedidos por dia | 80 | descrição do caso (fictício) |
| Dias úteis por mês | 22 | premissa minha |
| Minutos manuais por pedido | 8 | estimativa do entrevistado simulado |
| Minutos por exceção | 4 | premissa minha |
| Custo da hora | R$ 38,00 | premissa minha |

Resultado por taxa de revisão (conta feita com a função do código):

| Taxa de revisão | Min. residuais/pedido | Horas liberadas/mês | Valor estimado/mês |
|---|---|---|---|
| 10% | 0,4 | 222,9 h | R$ 8.471,47 |
| 20% (base) | 0,8 | 211,2 h | R$ 8.025,60 |
| 27,5% (a do lote de exemplo) | 1,1 | 202,5 h | R$ 7.693,43 |
| 35% | 1,4 | 193,6 h | R$ 7.356,80 |

Exemplo da conta base: `1.760 × (8,0 − 0,8) / 60 = 211,2 h`; `211,2 × 38 = R$ 8.025,60`.

### Como ler
- É **estimativa**, não resultado: se qualquer entrada mudar, o número muda. Não uso "reduziu X%" em nenhum lugar deste repositório.
- São horas liberadas, não corte de custo. Não incluem implantação, manutenção nem a hora do gerente nas aprovações.
- A entrada mais frágil é a taxa de revisão, que só se descobre com pedidos reais; por isso o sistema mede essa taxa desde o primeiro dia.

Detalhes do processo atual e do futuro: [AS-IS](../01-discovery/06-processo-atual-as-is.md) e [TO-BE](../02-definicao/07-processo-to-be.md). Resultados dos testes: [`../05-qualidade/01-resultados-de-testes.md`](../05-qualidade/01-resultados-de-testes.md).
