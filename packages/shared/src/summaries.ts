// Resumos de votações em linguagem simples (content/resumos/{idVotacao}.md). Ver o LEIA-ME da pasta.
// Leitor puro (sem disco), usado pelo pipeline e pela página de revisão do site (só em `pnpm dev`).
import { z } from "zod";
import { GLOSSARY_LINK } from "./glossary-links";

export * from "./glossary-links";

const frontmatterSchema = z.object({
  revisado: z.boolean(),
  autor: z.string().optional(),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Link do texto oficial lido para escrever o resumo (inteiro teor ou parecer). */
  fonte: z.url().optional(),
});

/** Seções aceitas no corpo do arquivo, na ordem em que devem aparecer. */
export const SUMMARY_SECTIONS = {
  text: "O que estava em votação",
  curiosity: "Curiosidade",
  doubts: "Dúvidas",
} as const;

export interface PlainSummary {
  voteId: string;
  reviewed: boolean;
  /** "O que estava em votação". */
  text: string;
  /** "Curiosidade" (opcional). */
  curiosity: string | null;
  /** "Dúvidas" de quem escreveu o rascunho; nunca publicado. */
  doubts: string | null;
  /** Link do texto oficial usado. */
  source: string | null;
}

function fail(voteId: string, message: string): never {
  throw new Error(`content/resumos/${voteId}.md: ${message}`);
}

/** Junta as linhas de uma seção num parágrafo só (o site mostra cada seção como um parágrafo). */
function joinLines(lines: string[]): string {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Lê o cabeçalho (chave: valor por linha) e as seções do corpo. Lança erro claro se estiver
 * malformado. Corpo sem nenhum título `##` vale inteiro como "O que estava em votação".
 */
export function parseSummaryFile(voteId: string, content: string): PlainSummary {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content);
  if (!match) fail(voteId, `falta o cabeçalho entre "---" (revisado: true|false).`);
  const fields: Record<string, unknown> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const kv = /^([a-z]+):\s*(.*)$/.exec(line.trim());
    if (!kv) fail(voteId, `linha inválida no cabeçalho: "${line}"`);
    const value = kv[2]!.trim().replace(/^["']|["']$/g, "");
    fields[kv[1]!] = value === "true" ? true : value === "false" ? false : value;
  }
  const parsed = frontmatterSchema.safeParse(fields);
  if (!parsed.success) {
    fail(
      voteId,
      `cabeçalho inválido (${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}).`,
    );
  }

  // Seções do corpo.
  const titles = Object.values(SUMMARY_SECTIONS) as string[];
  const keys = Object.keys(SUMMARY_SECTIONS) as (keyof typeof SUMMARY_SECTIONS)[];
  const sections = new Map<keyof typeof SUMMARY_SECTIONS, string[]>();
  let current: keyof typeof SUMMARY_SECTIONS | null = null;
  const loose: string[] = [];
  let lastIndex = -1;
  for (const line of match[2]!.split(/\r?\n/)) {
    const heading = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (heading) {
      const index = titles.indexOf(heading[1]!);
      if (index < 0) {
        fail(voteId, `seção desconhecida "${heading[1]}". Use só: ${titles.join(", ")}.`);
      }
      if (index <= lastIndex) fail(voteId, `seção "${heading[1]}" repetida ou fora de ordem.`);
      lastIndex = index;
      current = keys[index]!;
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
    else loose.push(line);
  }
  if (sections.size > 0 && joinLines(loose)) {
    fail(voteId, `há texto antes da primeira seção ("## ${SUMMARY_SECTIONS.text}").`);
  }
  const text = sections.size > 0 ? joinLines(sections.get("text") ?? []) : joinLines(loose);
  const curiosity = joinLines(sections.get("curiosity") ?? []) || null;
  const doubts =
    (sections.get("doubts") ?? [])
      .map((l) => l.trimEnd())
      .join("\n")
      .trim() || null;

  // Links: só para o glossário do site.
  for (const [label, value] of [
    [SUMMARY_SECTIONS.text, text],
    [SUMMARY_SECTIONS.curiosity, curiosity ?? ""],
  ] as const) {
    const rest = value.replace(GLOSSARY_LINK, "");
    if (/\]\(|https?:\/\//.test(rest)) {
      fail(
        voteId,
        `em "${label}", só são aceitos links para o glossário, como [PEC](/glossario#pec).`,
      );
    }
  }

  const reviewed = parsed.data.revisado;
  if (reviewed && !text) fail(voteId, "marcado como revisado, mas sem texto.");
  if (reviewed && doubts) {
    fail(
      voteId,
      `marcado como revisado, mas ainda tem a seção "${SUMMARY_SECTIONS.doubts}". Resolva as dúvidas e apague a seção.`,
    );
  }
  return { voteId, reviewed, text, curiosity, doubts, source: parsed.data.fonte ?? null };
}
