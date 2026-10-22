# 0003 — Monorepo com pnpm workspaces e Turborepo

**Status:** aceito (22/10/2026)

## Contexto

Site, pipeline e cálculo das métricas compartilham tipos e esquemas. O projeto anterior (Chutaí) já usa este formato.

## Decisão

pnpm workspaces + Turborepo, com `apps/web` e `packages/{shared,metrics,pipeline}`. Pacotes internos não têm build: exportam `src/*.ts` direto. `packages/metrics` só tem funções puras (sem rede, disco ou relógio); tudo que acessa o mundo fica em `packages/pipeline`.

## Consequências

- Um só `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm typecheck` para tudo.
- As métricas são testáveis com dados pequenos escritos à mão nos testes.
