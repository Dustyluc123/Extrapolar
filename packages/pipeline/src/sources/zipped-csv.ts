// Arquivos CSV dentro de zip (cota parlamentar da Câmara e emendas da CGU): baixa com cache,
// extrai só o arquivo pedido, decodifica e valida cada linha com Zod.
import { unzipSync } from "fflate";
import type { z } from "zod";
import { parseOrThrow, type SourceInfo } from "@extrapolar/shared";
import { fetchBytesCached, type CachedFetchContext } from "../lib/cached-fetch";
import { csvToObjects, parseCsv } from "../lib/csv";
import { log } from "../lib/log";

export interface ZippedCsvSpec<S extends z.ZodType> {
  url: string;
  cacheKey: string;
  /** Nome do arquivo dentro do zip (ou null para o único .csv). */
  entry: string | null;
  encoding: "utf-8" | "latin1";
  rowSchema: S;
  source: Omit<SourceInfo, "lastModified">;
}

function extract(zip: Uint8Array, entry: string | null, label: string): Uint8Array {
  const files = unzipSync(zip, {
    filter: (file) => (entry ? file.name === entry : file.name.toLowerCase().endsWith(".csv")),
  });
  const names = Object.keys(files);
  if (names.length !== 1) {
    throw new Error(`${label}: esperado 1 arquivo CSV no zip, encontrados ${names.length}.`);
  }
  return files[names[0] as string] as Uint8Array;
}

export async function fetchZippedCsv<S extends z.ZodType>(
  context: CachedFetchContext,
  spec: ZippedCsvSpec<S>,
): Promise<{ rows: z.output<S>[]; source: SourceInfo }> {
  const label = spec.url;
  const result = await fetchBytesCached(context, spec.cacheKey, spec.url, {
    checkLastModified: true,
    validate: (body) => void extract(body, spec.entry, label), // zip válido antes de ir para o cache
  });
  log.info(`${spec.cacheKey.split("/").pop()} (${result.origin})`);
  const csv = extract(result.body, spec.entry, label);
  const text = new TextDecoder(spec.encoding === "latin1" ? "windows-1252" : "utf-8").decode(csv);
  const objects = csvToObjects(parseCsv(text), label);
  // Valida linha a linha (o erro aponta a linha: "[123].vlrLiquido").
  const rows = objects.map((row, index) =>
    parseOrThrow(spec.rowSchema, row, `${label} linha ${index + 2}`),
  );
  return { rows, source: { ...spec.source, lastModified: result.meta.lastModified } };
}
