// Links do glossário nos resumos de votações: `[termo](/glossario#slug)`. Sem dependências,
// para poder ir para o navegador (ilhas dos jogos) sem levar o Zod junto.

/** Único link aceito no texto: termo do glossário do site, como `[PEC](/glossario#pec)`. */
export const GLOSSARY_LINK = /\[([^\]\n]+)\]\(\/glossario#([a-z0-9-]+)\)/g;

export interface SummaryPart {
  text: string;
  /** Slug do glossário, quando o trecho é um link. */
  glossary?: string;
}

/** Quebra um texto em trechos simples e links do glossário (`[termo](/glossario#slug)`). */
export function splitGlossaryLinks(text: string): SummaryPart[] {
  const parts: SummaryPart[] = [];
  let last = 0;
  for (const match of text.matchAll(GLOSSARY_LINK)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[1]!, glossary: match[2]! });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** Slugs do glossário citados num texto (o site confere se existem). */
export function glossarySlugs(text: string): string[] {
  return [...text.matchAll(GLOSSARY_LINK)].map((m) => m[2]!);
}
