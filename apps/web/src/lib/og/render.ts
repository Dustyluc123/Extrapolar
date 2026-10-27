// Gera o PNG da imagem de prévia: satori (elementos → SVG) + resvg (SVG → PNG) + sharp (paleta), no build,
// sem servidor (ADR 0023). Fontes estáticas em WOFF dos pacotes @fontsource, embutidas no PNG.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { renderAsync } from "@resvg/resvg-js";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const require = createRequire(import.meta.url);

type FontStyle = "normal" | "italic";
type FontWeight = 400 | 500 | 600 | 700 | 800 | 900;
const FONT_FILES: { name: string; file: string; weight: FontWeight; style: FontStyle }[] = [
  {
    name: "Fraunces",
    file: "@fontsource/fraunces/files/fraunces-latin-600-normal.woff",
    weight: 600,
    style: "normal",
  },
  {
    name: "Fraunces",
    file: "@fontsource/fraunces/files/fraunces-latin-800-normal.woff",
    weight: 800,
    style: "normal",
  },
  {
    name: "Fraunces",
    file: "@fontsource/fraunces/files/fraunces-latin-900-normal.woff",
    weight: 900,
    style: "normal",
  },
  {
    name: "Newsreader",
    file: "@fontsource/newsreader/files/newsreader-latin-400-normal.woff",
    weight: 400,
    style: "normal",
  },
  {
    name: "Newsreader",
    file: "@fontsource/newsreader/files/newsreader-latin-400-italic.woff",
    weight: 400,
    style: "italic",
  },
  {
    name: "Newsreader",
    file: "@fontsource/newsreader/files/newsreader-latin-500-normal.woff",
    weight: 500,
    style: "normal",
  },
];

let fonts: Promise<Parameters<typeof satori>[1]["fonts"]> | null = null;
function loadFonts() {
  fonts ??= Promise.all(
    FONT_FILES.map(async ({ name, file, weight, style }) => ({
      name,
      weight,
      style,
      data: await readFile(require.resolve(file)),
    })),
  );
  return fonts;
}

export async function renderPng(element: ReactNode): Promise<Buffer> {
  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  // renderAsync e sharp rodam fora da thread principal: com build.concurrency, várias imagens
  // são geradas ao mesmo tempo.
  const png = (
    await renderAsync(svg, { fitTo: { mode: "original" }, font: { loadSystemFonts: false } })
  ).asPng();
  // Paleta de 64 cores: a imagem é papel, tinta e vermelho; fica ~3× menor sem diferença visível.
  return sharp(png).png({ palette: true, colours: 64, effort: 3, compressionLevel: 9 }).toBuffer();
}
