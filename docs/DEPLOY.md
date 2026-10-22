# Deploy

O site é estático e fica na **Vercel**. Os dados são atualizados por um workflow agendado no **GitHub Actions** (`.github/workflows/pipeline.yml`), que commita `data/generated/` no `main`; esse commit dispara o deploy pela integração Git da Vercel (ADR 0004).

```
cron diário (06:00 Brasília) → pnpm pipeline → testes + build → commit em data/generated → Vercel builda e publica
```

## Configurar a Vercel (uma vez) — TODO (Lucas)

1. Em https://vercel.com/new, importe o repositório `Dustyluc123/Extrapolar`.
2. **Root Directory:** `apps/web`. Deixe ligada a opção de incluir arquivos fora do Root Directory (o site lê `data/generated` e `docs/METODOLOGIA.md` da raiz).
3. **Framework:** Astro (detectado). **Build command:** padrão (`astro build`). **Output:** `dist`. **Install command:** padrão (`pnpm install`).
4. **Node.js:** 22.x (Settings → General).
5. **Variáveis de ambiente (opcional):** `SITE_URL` com o endereço público (ex.: o domínio definitivo), usado em links absolutos.
6. Faça o primeiro deploy e confira a capa, uma ficha (`/deputados/204379`) e `/metodologia`.

## Deploy hook (opcional) — TODO (Lucas)

Serve para forçar um deploy sem mudança nos dados (pelo disparo manual do workflow, com "forcar_deploy").

1. Na Vercel: Settings → Git → Deploy Hooks → crie um hook para o branch `main`.
2. No GitHub: Settings → Secrets and variables → Actions → New repository secret: `VERCEL_DEPLOY_HOOK_URL` com a URL do hook.

## GitHub Actions — TODO (Lucas)

- O workflow precisa de permissão de escrita para commitar: Settings → Actions → General → Workflow permissions → "Read and write permissions" (o arquivo já pede `contents: write`, mas a configuração do repositório pode bloquear).
- Se o `main` tiver proteção de branch exigindo pull request, o commit automático vai falhar. Nesse caso, libere o bot ou troque para abrir PR.
- Para testar: Actions → "Atualização dos dados" → Run workflow.
- Commits feitos pelo `GITHUB_TOKEN` não disparam o workflow de CI (comportamento do GitHub); o próprio workflow de dados roda testes e build antes de commitar.

## Rodar localmente

```bash
pnpm install
pnpm pipeline          # atualiza data/generated (usa o cache em data/raw)
pnpm build             # gera apps/web/dist
pnpm --filter @extrapolar/web preview   # serve o build em http://localhost:4321
```
