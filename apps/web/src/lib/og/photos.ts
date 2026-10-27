// Fotos oficiais da Câmara para as imagens de prévia das fichas, baixadas no build.
// Cache em node_modules/.cache (fora do Git; a Vercel guarda entre builds quando consegue).
// Foto que não baixar não quebra o build: a imagem sai sem foto e o log avisa.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { GrayImage } from "./halftone";

const CACHE_DIR = join(process.cwd(), "node_modules", ".cache", "extrapolar-og", "fotos");
const CONCURRENCY = 6;
const TRIES = 3;
const TIMEOUT_MS = 15_000;

export interface PhotoSource {
  id: number;
  photoUrl: string;
}

async function download(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < TRIES) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  throw new Error(`não baixou ${url}`, { cause: lastError });
}

async function loadPhoto(source: PhotoSource): Promise<Buffer | null> {
  const file = join(CACHE_DIR, `${source.id}.jpg`);
  try {
    return await readFile(file);
  } catch {
    // Sem cache: baixa.
  }
  try {
    const buffer = await download(source.photoUrl);
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, buffer);
    return buffer;
  } catch (error) {
    console.warn(`[og] Foto do deputado ${source.id} indisponível; prévia sem foto.`, error);
    return null;
  }
}

let pending: Map<number, Promise<Buffer | null>> | null = null;

/**
 * Começa a baixar todas as fotos de uma vez, com concorrência baixa (o Astro gera as imagens
 * uma por uma; baixar sob demanda deixaria o build esperando a rede a cada ficha).
 */
export function prefetchPhotos(sources: PhotoSource[]): void {
  if (pending) return;
  pending = new Map();
  const queue = [...sources];
  const resolvers = new Map<number, (value: Buffer | null) => void>();
  for (const source of sources) {
    pending.set(source.id, new Promise((resolve) => resolvers.set(source.id, resolve)));
  }
  const worker = async () => {
    for (let source = queue.shift(); source; source = queue.shift()) {
      resolvers.get(source.id)?.(await loadPhoto(source));
    }
  };
  for (let i = 0; i < CONCURRENCY; i++) void worker();
}

export async function photoFor(source: PhotoSource): Promise<Buffer | null> {
  return (await pending?.get(source.id)) ?? loadPhoto(source);
}

/** Foto em tons de cinza, recortada em 3:4 pelo topo (rosto), com uma amostra por célula. */
export async function grayGrid(photo: Buffer, cols: number, rows: number): Promise<GrayImage> {
  const { data, info } = await sharp(photo)
    .resize(cols, rows, { fit: "cover", position: "top" })
    .grayscale()
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 1) throw new Error(`Foto com ${info.channels} canais depois do cinza.`);
  return { pixels: new Uint8Array(data), cols, rows };
}
