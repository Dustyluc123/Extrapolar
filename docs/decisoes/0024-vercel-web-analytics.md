# 0024 — Contagem de visitas com o Vercel Web Analytics

**Status:** aceito (27/10/2026)

## Contexto

O site não sabia quantas pessoas abriam cada página, nem se os jogos eram usados. O Lucas pediu o Vercel Web Analytics (o site já fica na Vercel), só com visualizações de página. Os jogos prometem que o voto do jogador fica no navegador (ADR 0021).

## Decisão

- Pacote oficial `@vercel/analytics`, componente `<Analytics />` de `@vercel/analytics/astro` no fim do `BaseLayout.astro`: todas as páginas são contadas, inclusive `/jogos` e `/ranking`.
- **Só visualizações de página.** Sem eventos personalizados (`track()`), sem identificar a pessoa. O Web Analytics não usa cookies.
- **Nada dos jogos vai para o analytics:** nem voto, nem estado escolhido, nem palpite. Os jogos não põem escolhas na URL; o componente conta o caminho da página no build (`Astro.url.pathname`). Por garantia, um `beforeSend` (`window.webAnalyticsBeforeSend`, definido no layout) tira a query string e a âncora do endereço antes do envio: os critérios do `/ranking` ficam na URL e não devem ir.
- Em `pnpm dev`, o pacote roda em modo de depuração (mostra no console e não envia). No preview local e antes da ativação no painel, o script `/_vercel/insights/script.js` não existe; o navegador avisa no console e nada quebra.
- A página "Sobre" explica em duas frases (seção "Privacidade"); o aviso dos jogos passou a "Suas respostas ficam só neste aparelho e nunca são enviadas", com link para ela.

## Alternativas descartadas

- **Google Analytics ou similares:** cookies, banner de consentimento e dados para terceiros.
- **Eventos por jogo (começou, terminou):** úteis, mas ficam para depois, com pedido explícito; nunca com o conteúdo das escolhas.

## Consequências

- Um script pequeno a mais em todas as páginas (~1 KB comprimido, mais o script da Vercel).
- TODO (Lucas): ativar o Analytics no painel da Vercel (`docs/DEPLOY.md`).
