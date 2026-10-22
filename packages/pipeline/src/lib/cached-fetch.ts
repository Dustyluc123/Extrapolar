// Busca um JSON usando o cache em data/raw, conforme a política descrita em docs/ARQUITETURA.md:
// - dentro da validade (ttl): usa o cache;
// - vencido e com conferência de Last-Modified (arquivos estáticos): faz HEAD e
//   reaproveita o cache se o arquivo oficial não mudou;
// - caso contrário (ou com refresh): baixa de novo.
import type { CacheEntryMeta, FileCache } from "./cache";
import { isFresh } from "./cache";
import type { HttpClient } from "./http";

export const DEFAULT_TTL_MS = 20 * 60 * 60 * 1000;

export interface CachedFetchContext {
  client: HttpClient;
  cache: FileCache;
  refresh: boolean;
  ttlMs?: number;
  now?: () => number;
}

export interface CachedJson {
  data: unknown;
  meta: CacheEntryMeta;
  /** "cache" = usou o arquivo local; "conferido" = HEAD confirmou que não mudou; "baixado" = download novo. */
  origin: "cache" | "conferido" | "baixado";
}

export async function fetchJsonCached(
  context: CachedFetchContext,
  key: string,
  url: string,
  options: { checkLastModified?: boolean } = {},
): Promise<CachedJson> {
  const { client, cache, refresh } = context;
  const ttlMs = context.ttlMs ?? DEFAULT_TTL_MS;
  const now = context.now ?? Date.now;
  const cached = refresh ? null : await cache.read(key);

  if (cached && cached.meta.url === url) {
    if (isFresh(cached.meta, ttlMs, now())) {
      return { data: await cache.readJson(cached), meta: cached.meta, origin: "cache" };
    }
    if (options.checkLastModified && cached.meta.lastModified) {
      const lastModified = await client.headLastModified(url);
      if (lastModified && lastModified === cached.meta.lastModified) {
        const meta = { ...cached.meta, savedAt: new Date(now()).toISOString() };
        await cache.writeMeta(key, meta);
        return { data: await cache.readJson(cached), meta, origin: "conferido" };
      }
    }
  }

  const response = await client.request(url, { headers: { Accept: "application/json" } });
  const body = new Uint8Array(await response.arrayBuffer());
  const meta: CacheEntryMeta = {
    url,
    savedAt: new Date(now()).toISOString(),
    lastModified: response.headers.get("last-modified"),
  };
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new Error(`Resposta de ${url} não é um JSON válido.`);
  }
  // Só grava no cache depois de confirmar que é JSON.
  await cache.write(key, body, meta);
  return { data, meta, origin: "baixado" };
}
