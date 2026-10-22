// Etapa 4: valida a saída e grava data/generated de forma atômica.
// Se qualquer arquivo for inválido, nada é gravado.
import { mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { z } from "zod";
import { parseOrThrow } from "@extrapolar/shared";
import { log } from "../lib/log";

export interface OutputFile<T extends z.ZodType = z.ZodType> {
  /** Caminho relativo à pasta de saída (ex.: "meta.json" ou "deputados/204379.json"). */
  name: string;
  schema: T;
  data: unknown;
}

export interface PublishOptions {
  /**
   * Subpastas cujo conteúdo é inteiramente gerado pelo pipeline: arquivos .json que não fizerem
   * parte desta publicação são apagados (ex.: deputado que saiu de exercício).
   */
  ownedDirs?: string[];
}

export async function publish(
  dir: string,
  files: readonly OutputFile[],
  options: PublishOptions = {},
): Promise<void> {
  log.step("Validando e publicando data/generated");
  // 1. valida tudo antes de escrever qualquer coisa
  const validated = files.map((file) => ({
    name: file.name,
    data: parseOrThrow(file.schema, file.data, `saída ${file.name}`),
  }));

  // 2. escreve numa pasta temporária ao lado e só então move para o lugar
  await mkdir(dir, { recursive: true });
  const tmp = await mkdtemp(join(dir, ".tmp-"));
  try {
    for (const file of validated) {
      const target = join(tmp, file.name);
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, `${JSON.stringify(file.data)}\n`);
    }
    for (const file of validated) {
      const target = join(dir, file.name);
      await mkdir(join(target, ".."), { recursive: true });
      await rename(join(tmp, file.name), target);
    }
    log.info(`${validated.length} arquivo(s) gravado(s)`);

    // 3. remove sobras nas pastas que pertencem ao pipeline
    const written = new Set(validated.map((file) => file.name));
    for (const owned of options.ownedDirs ?? []) {
      let entries: string[] = [];
      try {
        entries = await readdir(join(dir, owned));
      } catch {
        continue;
      }
      for (const entry of entries) {
        const name = `${owned}/${entry}`;
        if (entry.endsWith(".json") && !written.has(name)) {
          await rm(join(dir, name));
          log.info(`removido ${name} (não faz mais parte dos dados)`);
        }
      }
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
