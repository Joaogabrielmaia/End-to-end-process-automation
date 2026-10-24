# Glossário

Termos e siglas usados na série, em linguagem de negócio, com link para onde aparecem.

## Termos

| Termo | O que significa | Onde aparece |
|---|---|---|
| Exceção | Pedido que a automação não quis decidir sozinha e que espera uma pessoa, com o motivo escrito em português | [ADR-005](03-arquitetura/ADRs.md#adr-005--como-tratar-exceções) |
| Fila de exceções | Tela que lista as exceções abertas, da mais antiga para a mais nova, com botão de correção | [Captura da fila](screenshots/04-fila-de-excecoes.png) |
| Idempotência | Receber a mesma mensagem duas vezes e criar só um pedido | [ADR-003](03-arquitetura/ADRs.md#adr-003--idempotência-pelo-identificador-da-mensagem) |
| Message-ID | Identificador único que o e-mail carrega; o Fluxo o usa para reconhecer reenvio | [ADR-003](03-arquitetura/ADRs.md#adr-003--idempotência-pelo-identificador-da-mensagem) |
| n8n | Ferramenta de automação visual que, aqui, recebe a mensagem, tenta o envio três vezes e dá o alerta | [n8n: como rodar](04-processo/n8n-como-rodar.md) |
| Webhook | Endereço que recebe uma chamada de outro sistema; aqui simula a caixa de e-mail | [n8n: como rodar](04-processo/n8n-como-rodar.md) |
| Trilha de auditoria (append-only) | Registro de eventos que só recebe novas linhas; mostra quem decidiu o quê e quando | [ADR-006](03-arquitetura/ADRs.md#adr-006--auditoria) |
| Extração por regras | Ler o texto do pedido com regras fixas, sem modelo de linguagem; o modo com LLM é opcional e não foi executado | [ADR-004](03-arquitetura/ADRs.md#adr-004--extração-por-regra-ou-por-llm) |
| p95 | Valor abaixo do qual ficam 95% das medições; mostra a cauda lenta que a média esconde | [Relatório de medição](04-processo/relatorio-de-medicao.md) |
| Deadlock | Duas operações no banco esperando uma pela outra; a carga de 500 mensagens revelou um e ele foi corrigido | [Relatório de medição](04-processo/relatorio-de-medicao.md) |
| CSV para BI | Arquivos de texto com tabelas, que o Power BI lê para montar relatórios | [Exportação CSV](06-pos-lancamento/power-bi.md) |

## Siglas

| Sigla | O que significa | Onde aparece |
|---|---|---|
| RF / RNF | Requisito funcional / não funcional | [Requisitos](02-definicao/01-requisitos.md) |
| RN | Regra de negócio, com código de exceção | [Regras de negócio](02-definicao/02-regras-de-negocio.md) |
| HU | História de usuário | [Histórias](02-definicao/03-historias-e-moscow.md) |
| ADR | Registro de decisão de arquitetura | [ADRs](03-arquitetura/ADRs.md) |
| MoSCoW | Priorização em Must, Should, Could e Won't | [Histórias](02-definicao/03-historias-e-moscow.md) |
| AS-IS / TO-BE | Processo como é hoje / como fica com o Fluxo | [AS-IS](01-discovery/06-processo-atual-as-is.md), [TO-BE](02-definicao/07-processo-to-be.md) |
| SKU | Código de produto no cadastro | [Regras de negócio](02-definicao/02-regras-de-negocio.md) |
| ERP | Sistema de gestão da empresa; o do caso é fechado e não é integrado | [Reunião 2](01-discovery/04-reuniao-lancador-de-pedidos.md) |
| IMAP | Protocolo para ler uma caixa de e-mail; a leitura real não foi testada | [Resultados de testes](05-qualidade/01-resultados-de-testes.md) |
| LLM | Modelo de linguagem; opcional na extração e não executado | [ADR-004](03-arquitetura/ADRs.md#adr-004--extração-por-regra-ou-por-llm) |
| E2E | Teste ponta a ponta, feito no navegador | [Resultados de testes](05-qualidade/01-resultados-de-testes.md) |
| CNPJ | Registro de empresa; os do caso são fictícios | [Sobre este caso](00-sobre-este-caso/README.md) |

← [Índice](INDEX.md)
