# 0023 — Imagens de prévia geradas no build (satori + resvg)

**Status:** aceito (27/10/2026)

## Contexto

Links do Extrapolar compartilhados no WhatsApp e nas redes apareciam sem imagem: o site tinha só `og:title`, `og:description` e `og:locale`. O Chutaí gera as prévias com `ImageResponse` (Next.js), que roda num servidor a cada pedido. O Extrapolar é HTML estático, sem servidor (princípio 4), e tem 513 fichas.

## Decisão

- **Gerar todas as imagens no build**, como arquivos estáticos: o endpoint `apps/web/src/pages/og/[...slug].png.ts` (com `getStaticPaths`) desenha cada imagem com **satori** (elementos → SVG) e **@resvg/resvg-js** (SVG → PNG), e reduz o PNG com **sharp** (paleta de 64 cores, ~3× menor). São as mesmas bibliotecas por trás do `ImageResponse`, sem o servidor.
- **Imagens:** uma geral (`/og/extrapolar.png`, usada na capa e nas páginas sem imagem própria), `/og/jogos.png` (também em `/jogos/votacoes`), uma por jogo (`/og/jogos/<jogo>.png`), `/og/ranking.png` (genérica: o ranking de cada pessoa só existe no navegador) e uma por deputado (`/og/deputados/<id>.png`). 1200 × 630, PNG.
- **Ficha sem números.** A imagem do deputado tem foto em meio-tom, nome, partido, estado e a chamada "Veja o que fez na Câmara". Nenhuma métrica, para nada circular fora de contexto. A chamada não tem gênero porque os dados não trazem o sexo do deputado.
- **Meio-tom de verdade:** a foto oficial vira uma grade de pontos de tinta (`lib/og/halftone.ts`, função pura e testada), como o efeito em CSS das páginas (docs/DESIGN.md).
- **Fontes embutidas:** Fraunces e Newsreader estáticas em WOFF (`@fontsource/fraunces`, `@fontsource/newsreader`). O satori não lê WOFF2 nem fontes variáveis, que são as usadas nas páginas. Nenhum serviço externo de fontes.
- **Fotos:** baixadas da Câmara no build, 6 por vez, com novas tentativas, e guardadas em `node_modules/.cache/extrapolar-og/` (cache entre builds, quando a Vercel o mantém). Se uma foto não baixar, a imagem sai sem foto e o log avisa; o build não falha por isso.
- **Fora do Git:** as imagens saem em `apps/web/dist` a cada build (Vercel e CI).
- **URLs absolutas:** `og:image` e `og:url` usam `SITE_URL`; sem ele, o domínio de produção que a Vercel informa no build (`VERCEL_PROJECT_PRODUCTION_URL`); sem os dois, `http://localhost:4321` (`apps/web/src/lib/site.ts`).
- O Astro gera 4 páginas ao mesmo tempo (`build.concurrency: 4`), e o resvg (`renderAsync`) e o sharp trabalham fora da thread principal.

## Alternativas descartadas

- **Imagens no Git:** cerca de 17 MB a mais a cada mudança de desenho, e o robô diário teria que regerar.
- **Função serverless na Vercel (`@vercel/og`):** fere o "sem servidor" e depende da plataforma.
- **Capturas com o Chrome (Puppeteer):** mais lento, precisa do Chrome no build da Vercel.
- **Só uma imagem geral para tudo:** a prévia da ficha ficaria igual para os 513 deputados.

## Consequências

- Medido numa máquina de 12 núcleos: o build passou de ~21 s para ~51 s com as fotos em cache e ~60 s sem cache (o download das fotos corre enquanto as outras páginas são geradas). O build do workflow diário de dados, que não guarda esse cache, ganha o mesmo tempo. Na Vercel, com menos núcleos, deve demorar mais.
- 520 imagens, cerca de 17 MB no `dist` (média de 33 KB; as fichas ~30 a 40 KB, as fixas ~15 a 22 KB).
- Mudar o desenho = mudar `apps/web/src/lib/og/cards.tsx`; dá para ver em `pnpm dev` abrindo `/og/extrapolar.png` ou `/og/deputados/<id>.png`.
- O build depende do site da Câmara para as fotos (com tolerância a falha).
