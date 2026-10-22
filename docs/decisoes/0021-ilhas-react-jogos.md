# 0021 — Ilhas React nos jogos e no ranking; estado só no navegador

**Status:** aceito (22/10/2026) — Fase 2

## Contexto

Os jogos e o "Monte seu ranking" têm interação de verdade (chutes, autocompletar, controles, revelação, filtros, URL compartilhável). O ADR 0001 previa ilhas React para isso. O resto do site continua estático.

## Decisão

- `@astrojs/react` com `client:load` só nas páginas dos jogos e do ranking. As outras páginas não carregam React.
- As regras ficam em funções puras e testadas (`packages/games` e `packages/metrics/src/ranking.ts`); os componentes só desenham.
- **O voto do jogador é dele:** escolhas, sequência e estatísticas ficam em `localStorage` (`extrapolar:jogos:*`), sempre com `try/catch`. Nada é enviado; cada jogo diz isso na tela.
- Dados grandes (atributos dos deputados de cada estado) são arquivos JSON estáticos gerados no build (`/jogos/dados/*.json`) e baixados pela ilha só quando o jogador escolhe o estado; o resto vai como propriedade da ilha.
- Sem JavaScript, as páginas mostram "Como jogar", a votação e os links oficiais, e avisam que o jogo precisa de JavaScript.

## Consequências

- React (~60 KB comprimido) só nas páginas interativas.
- Mudar a regra de um jogo = mudar a função pura e o teste, não o componente.
