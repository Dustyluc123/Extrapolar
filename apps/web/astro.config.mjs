// Configuração do Astro. Site estático: tudo é gerado no build a partir de data/generated.
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
});
