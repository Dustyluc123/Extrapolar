// Resumos de votações em linguagem simples, escritos ou revisados à mão (content/resumos/).
// Um arquivo por votação: content/resumos/{idVotacao}.md, com frontmatter. Só é publicado com
// `revisado: true`; sem resumo revisado, os jogos mostram a ementa oficial. Ver o LEIA-ME da pasta.
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const frontmatterSchema = z.object({
  revisado: z.boolean(),
  autor: z.string().optional(),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export interface PlainSummary {
  voteId: string;
  reviewed: boolean;
  text: string;
}

/** Lê o frontmatter simples (chave: valor por linha) e o texto. Lança erro claro se estiver malformado. */
export function parseSummaryFile(voteId: string, content: string): PlainSummary {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  if (!match) {
    throw new Error(
      `content/resumos/${voteId}.md: falta o cabeçalho entre "---" (revisado: true|false).`,
    );
  }
  const fields: Record<string, unknown> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = /^([a-z]+):\s*(.*)$/.exec(line.trim());
    if (!kv)
      throw new Error(`content/resumos/${voteId}.md: linha inválida no cabeçalho: "${line}"`);
    const value = kv[2]!.trim().replace(/^["']|["']$/g, "");
    fields[kv[1]!] = value === "true" ? true : value === "false" ? false : value;
  }
  const parsed = frontmatterSchema.safeParse(fields);
  if (!parsed.success) {
    throw new Error(
      `content/resumos/${voteId}.md: cabeçalho inválido (${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}).`,
    );
  }
  const text = match[2]!.trim();
  if (parsed.data.revisado && !text) {
    throw new Error(`content/resumos/${voteId}.md: marcado como revisado, mas sem texto.`);
  }
  return { voteId, reviewed: parsed.data.revisado, text };
}

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
