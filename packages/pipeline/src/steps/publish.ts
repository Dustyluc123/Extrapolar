// Etapa 4: valida a saída e grava data/generated de forma atômica.
// Se qualquer arquivo for inválido, nada é gravado.
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { z } from "zod";
import { parseOrThrow } from "@extrapolar/shared";
import { log } from "../lib/log";

export interface OutputFile<T extends z.ZodType = z.ZodType> {
  name: string;
  schema: T;
  data: unknown;
}

export async function publish(dir: string, files: readonly OutputFile[]): Promise<void> {
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
      await writeFile(join(tmp, file.name), `${JSON.stringify(file.data)}\n`);
    }
    for (const file of validated) {
      await rename(join(tmp, file.name), join(dir, file.name));
      log.info(`gravado ${file.name}`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
