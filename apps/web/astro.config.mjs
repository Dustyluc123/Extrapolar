// Configuração do Astro. Site estático: tudo é gerado no build a partir de data/generated.
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  // Ilhas React só nos jogos e no "Monte seu ranking" (ADR 0021); o resto do site não carrega React.
  integrations: [react()],
  // Endereço público do site, usado em links absolutos. TODO (Lucas): definir SITE_URL na Vercel.
  site: process.env.SITE_URL || undefined,
  trailingSlash: "ignore",
  // Sem realce de sintaxe: os blocos de código da metodologia usam as cores do site.
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
