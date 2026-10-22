# 0004 — Dados gerados versionados no Git

**Status:** aceito (22/10/2026)

## Contexto

O briefing previa um deploy hook da Vercel acionado pelo pipeline. Mas o deploy hook builda a partir do repositório, então os JSON precisam estar no repositório de qualquer forma. Com eles no `main`, a integração Git da Vercel já faz o deploy sozinha.

## Decisão

- `data/generated/` é versionado. `data/raw/` (cache dos downloads) não.
- O workflow `pipeline.yml` roda diariamente e commita `data/generated/` no `main` quando algo mudou. Esse commit dispara o deploy pela integração Git da Vercel.
- O deploy hook (`VERCEL_DEPLOY_HOOK_URL`) fica como opção no disparo manual (`workflow_dispatch`, entrada `forcar_deploy`), para forçar um deploy sem mudança de dados.

## Consequências

- `pnpm dev` funciona com dados reais logo após clonar.
- O histórico do Git guarda a evolução dos dados (útil para auditoria).
- O repositório cresce com o tempo; os JSON são compactos (sem espaços) para limitar isso. Se crescer demais, reavaliar.
- Na prática há um commit por dia: `meta.json` traz a data de referência (a "edição" do dia, mostrada no cabeçalho), que muda a cada execução. Decidido durante a execução noturna (22/10/2026): mais simples do que comparar o conteúdo ignorando a data, e coerente com a ideia de edição diária. Os JSON têm ~300 KB no total e o Git guarda bem as diferenças.
