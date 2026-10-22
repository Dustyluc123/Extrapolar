# 0012 — Dados gerados por deputado, índice de métricas e "sem dado" padronizado

**Status:** aceito (22/10/2026) — Fase 1

## Contexto

A Fase 1 multiplica as métricas por deputado. Um arquivo único com tudo cresceria muito e mudaria inteiro todo dia (pior para o Git e para o build). A Fase 2 ("monte seu ranking") vai precisar ordenar sem recalcular.

## Decisão

- `data/generated/deputados.json`: índice leve (identidade de cada deputado em exercício), usado pela capa.
- `data/generated/deputados/{id}.json`: detalhe de cada deputado, organizado por caderno (`plenario`, `comissoes`, ...). **Não leva a data da edição**: só muda quando os dados daquele deputado mudam, então o commit diário só grava o que mudou. Deputado que sai de exercício tem o arquivo removido pelo pipeline.
- `data/generated/metricas.json`: para cada métrica, `{ key, caderno, label, unit, methodologyAnchor, values: { [id]: MetricValue } }`. **Não é ranking**: não traz posição, média nem comparação (ADR 0010).
- `MetricValue` padronizado: `{ status: "ok", value, numerator, denominator }` ou `{ status: "sem-dado", reason }`, com motivos fixos em `packages/shared/src/no-data.ts`. Nunca zero no lugar de sem dado.
- `meta.json` ganha `totals` (números da legislatura usados na capa); `participacao.json` da Fase 0 deixa de existir.
- `GENERATED_SCHEMA_VERSION` passa para 2.
- `scripts/repo-growth.mjs` (`pnpm repo-growth`) mede quanto o commit de dados vai acrescentar ao repositório.

## Consequências

- O site lê os 513 arquivos no build com `import.meta.glob` e valida cada um ao montar a ficha.
- Mudanças de formato exigem mudar o esquema em `packages/shared` (o pipeline e o site quebram juntos, de propósito).
