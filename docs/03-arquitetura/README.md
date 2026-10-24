# Episódio 3 — Arquitetura

Sete decisões registradas no formato contexto, alternativas, escolha, motivo, trade-off e quando mudaria. O n8n orquestra a entrada (retentativa e alerta); as regras ficam em código tipado, com teste unitário.

A validação é uma função pura, e o banco serve de rede de segurança (unicidade do `messageId`, CHECK de estoque). A idempotência usa o `Message-ID` com fallback por hash do conteúdo. A extração é por regras, com LLM opcional atrás de uma interface; o provedor com LLM não foi executado.

Exceções vão para uma fila própria e a correção sempre revalida. A auditoria é uma tabela de eventos que só recebe inserções, e a notificação passa por um adaptador trocável.

| Documento | O que contém | Itens |
|---|---|---|
| [ADRs](ADRs.md) | Decisões de arquitetura: n8n híbrido, onde fica cada regra, idempotência, extração, exceções, auditoria e notificação | 7 ADRs |

← [Anterior](../02-definicao/README.md) · [Índice](../INDEX.md) · [Próximo](../04-processo/README.md) →

---
