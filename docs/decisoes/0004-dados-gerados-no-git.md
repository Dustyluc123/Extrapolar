# 0004 — Dados gerados versionados no Git

**Status:** aceito (22/10/2026)

## Contexto

O briefing previa um deploy hook da Vercel acionado pelo pipeline. Mas o deploy hook builda a partir do repositório, então os JSON precisam estar no repositório de qualquer forma. Com eles no `main`, a integração Git da Vercel já faz o deploy sozinha.

## Decisão

- `data/generated/` é versionado. `data/raw/` (cache dos downloads) não.
- O workflow `pipeline.yml` roda diariamente, e só commita no `main` quando o conteúdo de `data/generated/` mudou. Esse commit dispara o deploy pela integração Git da Vercel.
- O deploy hook (`VERCEL_DEPLOY_HOOK_URL`) fica como opção no disparo manual (`workflow_dispatch`, entrada `forcar_deploy`), para forçar um deploy sem mudança de dados.

## Consequências

- `pnpm dev` funciona com dados reais logo após clonar.
- O histórico do Git guarda a evolução dos dados (útil para auditoria).
- O repositório cresce com o tempo; os JSON são compactos (sem espaços) para limitar isso. Se crescer demais, reavaliar.
- `meta.json` só muda quando os dados mudam (a data de geração não entra na comparação), para não gerar commits vazios todo dia.
