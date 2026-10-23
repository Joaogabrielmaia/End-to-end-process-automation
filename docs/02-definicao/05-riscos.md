# 05 · Riscos

Probabilidade (P) e impacto (I) em baixa/média/alta, avaliados por mim.

| ID | Risco | P | I | Mitigação | Rastreia |
|---|---|---|---|---|---|
| RK-01 | Extração entende errado e registra pedido incorreto | M | A | Limiar de confiança (RN-09); toda dúvida vai para fila; trilha de auditoria; testes com casos adversariais | RN-09 |
| RK-02 | Pedido duplicado por reenvio ou reprocessamento do gatilho | A | M | Idempotência por identificador + restrição de unicidade no banco | RN-10 |
| RK-03 | Perda de mensagem se o processamento cair | M | A | Persistir a mensagem antes de processar; retentativa; status `FAILED` visível | RNF-02, RN-12 |
| RK-04 | Estoque/crédito desatualizados (ERP fechado, carga diária) | A | M | Premissa documentada; reserva atômica no Fluxo; exceção quando não bate | RN-05, RN-06 |
| RK-05 | Corrida: dois pedidos disputam o mesmo estoque | M | M | Transação com verificação condicional no registro | RN-11 |
| RK-06 | Dependência de LLM (custo, privacidade, variação) | M | M | LLM opcional atrás de interface; padrão é determinístico; resultado do LLM também passa pela validação | ADR-004 |
| RK-07 | Excesso de exceções anula o ganho | M | A | Medir taxa de revisão; o painel mostra motivos para atacar os mais frequentes | RF-12 |
| RK-08 | Fila de exceções esquecida | M | M | Idade visível no painel; alerta de exceção parada (v1.1) | RN-13 |
| RK-09 | Vazamento de segredo no repositório | B | A | `.env` fora do git; `.env.example` só com valores de exemplo | RNF-06 |
| RK-10 | Estudo ser lido como se fosse resultado real | M | A | Avisos de integridade em README e documentos; ganho como estimativa declarada | — |
