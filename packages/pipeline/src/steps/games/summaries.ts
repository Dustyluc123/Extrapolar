// Resumos de votações em linguagem simples, escritos ou revisados à mão (content/resumos/).
// Um arquivo por votação: content/resumos/{idVotacao}.md, com cabeçalho e seções. Só é publicado
// com `revisado: true`; sem resumo revisado, os jogos mostram a ementa oficial. O formato e o
// leitor ficam em @extrapolar/shared (summaries.ts); ver também o LEIA-ME da pasta.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseSummaryFile, type PlainSummary } from "@extrapolar/shared";

export { parseSummaryFile, type PlainSummary };

/** Lê todos os resumos da pasta (pasta ausente = nenhum resumo). */
export async function readPlainSummaries(dir: string): Promise<Map<string, PlainSummary>> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return new Map();
  }
  const result = new Map<string, PlainSummary>();
  for (const entry of entries.sort()) {
    const match = /^(.+)\.md$/.exec(entry);
    if (!match || entry.toUpperCase() === "LEIA-ME.MD") continue;
    const content = await readFile(join(dir, entry), "utf8");
    result.set(match[1]!, parseSummaryFile(match[1]!, content));
  }
  return result;
}
