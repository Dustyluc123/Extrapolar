// Inclinação da marca de carimbo: "torta como carimbo de verdade", mas fixa para cada documento
// (derivada do id), para não mudar a cada visita nem entre o servidor e o navegador.

/** Hash FNV-1a de 32 bits (não é segurança; só espalha os valores). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface InkTilt {
  /** Graus: entre 2 e 8, para um lado ou para o outro. */
  angle: number;
  /** Deslocamento em % do tamanho da marca, entre −6 e 6. */
  dx: number;
  dy: number;
}

export function inkTilt(seed: string): InkTilt {
  const h = hash(seed);
  const magnitude = 2 + ((h & 0xff) / 255) * 6;
  const sign = h & 0x100 ? 1 : -1;
  const dx = (((h >>> 9) & 0xff) / 255) * 12 - 6;
  const dy = (((h >>> 17) & 0xff) / 255) * 12 - 6;
  const round = (n: number) => Math.round(n * 10) / 10;
  return { angle: round(sign * magnitude), dx: round(dx), dy: round(dy) };
}
