# 0011 — Verificações automáticas de neutralidade, acessibilidade e layout

**Status:** aceito (22/10/2026) — decidido durante a execução noturna, pendente de revisão do Lucas

## Contexto

O plano previa uma varredura de palavras proibidas (só em `apps/web`, só aviso, com exceções) e conferência de contraste, teclado e celular.

## Decisão

- **Neutralidade:** `scripts/check-neutrality.mjs` (JavaScript puro, sem precisar de tsx na raiz) roda no CI como `pnpm check:neutralidade`. Varre `apps/web/src` (`.astro`, `.ts`, `.tsx`, `.md`, `.mdx`), compara sem acento, gera anotação `::warning` e sempre sai com código 0. Exceções em `scripts/neutrality-allowlist.json` com arquivo, trecho e motivo. `docs/METODOLOGIA.md` aparece no site, mas não é varrido (pedido explícito de olhar só `apps/web`).
- **Acessibilidade:** `scripts/a11y.mjs` (`pnpm check:a11y`) roda o axe-core (regras WCAG 2.1 A e AA) na capa, numa ficha, na metodologia e no "Sobre", nos temas claro e escuro, e testa a busca da capa pelo teclado. Usa o Chrome instalado na máquina, por isso **não está no CI**.
- **Layout no celular:** `scripts/screenshots.mjs` (`pnpm screenshots`) tira capturas com emulação de celular de verdade (o Chrome headless comum não aceita janela de 390 px) e acusa rolagem horizontal. As capturas ficam em `docs/screenshots/`, fora do Git (mudam a cada ajuste e pesam ~1 MB cada); as imagens do README ficam em `docs/imagens/`, em JPEG reduzido.

## Consequências

- Rodar `check:a11y` e `screenshots` exige `pnpm build && pnpm --filter @extrapolar/web preview` e o Google Chrome.
- Para levar a acessibilidade ao CI no futuro: instalar o Chrome no runner (ex.: `browser-actions/setup-chrome`) e apontar a variável `CHROME`.
