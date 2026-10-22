# 0001 — Astro para o site

**Status:** aceito (22/10/2026)

## Contexto

O site é quase todo conteúdo (listas, fichas, textos de metodologia). Interação de verdade só virá em fases futuras (jogos, "monte seu ranking"). Custo precisa ficar perto de zero.

## Decisão

Usar **Astro** com saída estática (`output: "static"`). HTML puro por padrão; ilhas React só onde houver interação que justifique um framework.

## Consequências

- Páginas rápidas e baratas de servir (CDN da Vercel, sem servidor).
- Cada atualização de dados exige um novo build (feito pela Vercel a cada commit de dados).
- Para os jogos, adicionar `@astrojs/react` e usar ilhas com `client:visible`.
