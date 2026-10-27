// Configuração do Astro. Site estático: tudo é gerado no build a partir de data/generated.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { resolveSiteUrl } from "./src/lib/site";

export default defineConfig({
  output: "static",
  // Ilhas React só nos jogos e no "Monte seu ranking" (ADR 0021); o resto do site não carrega React.
  integrations: [react()],
  // Endereço público do site, usado nas URLs absolutas (og:url, og:image): SITE_URL, ou o domínio
  // de produção que a Vercel informa no build, ou localhost (src/lib/site.ts).
  site: resolveSiteUrl(process.env),
  trailingSlash: "ignore",
  // Páginas geradas em paralelo: as imagens de prévia (ADR 0023) usam resvg e sharp fora da
  // thread principal, e o build cai pela metade.
  build: { concurrency: 4 },
  // Sem realce de sintaxe: os blocos de código da metodologia usam as cores do site.
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
    // Imagens de prévia (ADR 0023): resvg e sharp têm binários nativos; o Vite não deve empacotá-los.
    optimizeDeps: { exclude: ["@resvg/resvg-js", "sharp"] },
    ssr: { external: ["@resvg/resvg-js", "sharp"] },
  },
});
