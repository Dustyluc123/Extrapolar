# 0005 — Busca e filtros da capa sem React

**Status:** aceito (22/10/2026)

## Contexto

A capa lista ~513 deputados com busca por nome e filtros por estado e partido. Os itens já vêm renderizados no HTML.

## Decisão

Implementar busca e filtros com um `<script>` TypeScript do Astro que mostra/esconde os itens (atributos `data-*`). Sem React nesta fase.

## Consequências

- Nenhum JavaScript de framework na página; poucos KB de script.
- Sem JavaScript, a lista completa continua visível (melhoria progressiva).
- React entra quando houver interação complexa (jogos, "monte seu ranking").
