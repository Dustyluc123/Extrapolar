# 0002 — Sem banco de dados na Fase 0

**Status:** aceito (22/10/2026)

## Contexto

Os dados mudam no máximo uma vez por dia e são públicos. Um banco exigiria servidor ou serviço pago e mais pontos de falha.

## Decisão

O pipeline gera arquivos JSON em `data/generated/` que o Astro lê no build. O site acessa os dados só pela interface `DeputyRepository` (`packages/shared/src/repositories.ts`), implementada hoje por `JsonDeputyRepository` (`apps/web/src/lib/data.ts`).

## Consequências

- Zero infraestrutura de dados.
- Quando houver necessidade (consultas cruzadas, "vote você também"), basta criar uma implementação com PostgreSQL da mesma interface, como no Chutaí, sem mudar as páginas.
