// Meio-tom (retícula) de jornal para as imagens de prévia: cada célula da foto em tons de cinza
// vira um ponto de tinta, maior onde a foto é mais escura. Função pura: recebe os pixels e devolve
// um SVG. Na página, o mesmo efeito é feito em CSS (docs/DESIGN.md, "Fotos").

export interface GrayImage {
  /** Um byte por pixel (0 = preto, 255 = branco), linha a linha. */
  pixels: Uint8Array;
  cols: number;
  rows: number;
}

export interface HalftoneOptions {
  /** Tamanho de cada célula em px no SVG final. */
  cell: number;
  ink: string;
  paper: string;
  /** Contraste aplicado antes da retícula (1 = sem mudança), como o contrast(1.15) do CSS. */
  contrast?: number;
}

/** Raio do ponto para um tom de cinza: área do ponto proporcional à tinta. */
export function dotRadius(gray: number, cell: number, contrast = 1): number {
  const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
  const darkness = 1 - adjusted / 255;
  // 0,71 × célula = metade da diagonal: nos tons mais escuros, os pontos se encostam.
  const radius = Math.min(cell * 0.71, (cell / 2) * Math.sqrt(darkness) * 1.25);
  return radius < 0.25 ? 0 : Math.round(radius * 100) / 100;
}

export function halftoneSvg(image: GrayImage, options: HalftoneOptions): string {
  const { cols, rows, pixels } = image;
  if (pixels.length !== cols * rows) {
    throw new Error(`Meio-tom: esperava ${cols * rows} pixels, recebeu ${pixels.length}.`);
  }
  const { cell, ink, paper, contrast = 1 } = options;
  const width = cols * cell;
  const height = rows * cell;
  const dots: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const r = dotRadius(pixels[y * cols + x] ?? 255, cell, contrast);
      if (r > 0)
        dots.push(`<circle cx="${x * cell + cell / 2}" cy="${y * cell + cell / 2}" r="${r}"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${paper}"/>` +
    `<g fill="${ink}">${dots.join("")}</g></svg>`
  );
}
