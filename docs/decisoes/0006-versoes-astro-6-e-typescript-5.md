# 0006 — Astro 6 e TypeScript 5.9

**Status:** aceito (22/10/2026)

## Contexto

Na criação do projeto, as versões mais novas eram Astro 7.4 e TypeScript 7.0. O Astro 7 exige Node >= 22.23.4 (a máquina de desenvolvimento tinha 22.18.0). O `typescript-eslint` aceita TypeScript `< 6.1` e o `@astrojs/check` aceita `^5 || ^6`.

## Decisão

Usar **Astro 6.4** (`~6.4.8`, exige Node >= 22.12) e **TypeScript 5.9** (`~5.9.3`), as mesmas faixas do Chutaí.

## Consequências

- Funciona com o Node já instalado.
- Atualizar para Astro 7 depois de atualizar o Node para >= 22.23.4; atualizar o TypeScript quando o ecossistema de lint e check aceitar a versão 7.
