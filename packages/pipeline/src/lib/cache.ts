// Cache de downloads em data/raw. Cada arquivo tem um .meta.json ao lado com
// a URL, quando foi baixado e o Last-Modified informado pela Câmara.
import { mkdir, readFile, stat, writeFile, rename } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface CacheEntryMeta {
  url: string;
  /** Momento do download (ISO, UTC). */
  savedAt: string;
  lastModified: string | null;
}

export interface CachedFile {
  path: string;
  meta: CacheEntryMeta;
}

export class FileCache {
  constructor(readonly dir: string) {}

  pathFor(key: string): string {
    return join(this.dir, key);
  }

  async read(key: string): Promise<CachedFile | null> {
    const path = this.pathFor(key);
    try {
      await stat(path);
      const meta = JSON.parse(await readFile(`${path}.meta.json`, "utf8")) as CacheEntryMeta;
      return { path, meta };
    } catch {
      return null;
    }
  }

  async write(key: string, body: Uint8Array | string, meta: CacheEntryMeta): Promise<CachedFile> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    // Escreve em temporário e renomeia, para não deixar arquivo pela metade no cache.
    await writeFile(`${path}.tmp`, body);
    await rename(`${path}.tmp`, path);
    await this.writeMeta(key, meta);
    return { path, meta };
  }

  async writeMeta(key: string, meta: CacheEntryMeta): Promise<void> {
    await writeFile(`${this.pathFor(key)}.meta.json`, JSON.stringify(meta, null, 2));
  }

  async readBytes(file: CachedFile): Promise<Uint8Array> {
    return new Uint8Array(await readFile(file.path));
  }

  async readJson(file: CachedFile): Promise<unknown> {
    return JSON.parse(await readFile(file.path, "utf8"));
  }
}

/** true se o arquivo foi baixado há menos de `ttlMs`. */
export function isFresh(meta: CacheEntryMeta, ttlMs: number, nowMs: number): boolean {
  return nowMs - Date.parse(meta.savedAt) < ttlMs;
}
