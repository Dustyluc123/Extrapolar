// Jogo 1 (Dle do seu estado): compara o deputado chutado com o do dia, atributo por atributo.
// Adaptado do Chutaí (packages/game/src/compare.ts). Verde = igual, amarelo = perto ou em comum,
// vermelho = diferente; setas dizem se o número do deputado do dia é maior ou menor.

export type AttributeKind = "text" | "number" | "list";

export interface AttributeDefinition {
  key: string;
  label: string;
  kind: AttributeKind;
  /** Número: diferença absoluta que ainda conta como "perto". */
  tolerance?: number;
  /** Número: diferença relativa (0,2 = 20% do valor do deputado do dia) que conta como "perto". */
  relativeTolerance?: number;
  /** Texto: grupo de cada valor (ex.: partido → federação). Mesmo grupo conta como "perto". */
  groups?: Readonly<Record<string, string>>;
}

export type AttributeValue = string | number | readonly string[] | null;

export type FeedbackStatus = "hit" | "near" | "miss" | "unknown";

export interface AttributeFeedback {
  key: string;
  status: FeedbackStatus;
  /** Para números: o valor do dia é maior ("up") ou menor ("down") que o chutado. */
  direction?: "up" | "down";
}

/** Texto sem acento e sem diferença de maiúsculas (busca e comparação). */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function compareAttribute(
  attribute: AttributeDefinition,
  guess: AttributeValue,
  answer: AttributeValue,
): AttributeFeedback {
  const base = { key: attribute.key };
  // Sem dado de um dos lados: ninguém sabe, não conta como erro.
  if (guess === null || answer === null) return { ...base, status: "unknown" };

  switch (attribute.kind) {
    case "text": {
      const g = String(guess);
      const a = String(answer);
      if (foldText(g) === foldText(a)) return { ...base, status: "hit" };
      const groupG = attribute.groups?.[g];
      const groupA = attribute.groups?.[a];
      if (groupG !== undefined && groupG === groupA) return { ...base, status: "near" };
      return { ...base, status: "miss" };
    }
    case "list": {
      const g = new Set((guess as readonly string[]).map(foldText));
      const a = new Set((answer as readonly string[]).map(foldText));
      const shared = [...g].filter((item) => a.has(item)).length;
      if (shared === g.size && shared === a.size) return { ...base, status: "hit" };
      return { ...base, status: shared > 0 ? "near" : "miss" };
    }
    case "number": {
      const g = Number(guess);
      const a = Number(answer);
      if (g === a) return { ...base, status: "hit" };
      const direction = a > g ? "up" : "down";
      const margin = Math.max(
        attribute.tolerance ?? 0,
        attribute.relativeTolerance !== undefined ? Math.abs(a) * attribute.relativeTolerance : 0,
      );
      const near = margin > 0 && Math.abs(a - g) <= margin;
      return { ...base, status: near ? "near" : "miss", direction };
    }
  }
}

export function compareAll(
  attributes: readonly AttributeDefinition[],
  guess: Readonly<Record<string, AttributeValue>>,
  answer: Readonly<Record<string, AttributeValue>>,
): AttributeFeedback[] {
  return attributes.map((attribute) =>
    compareAttribute(attribute, guess[attribute.key] ?? null, answer[attribute.key] ?? null),
  );
}

/** Número de chutes do Dle conforme o tamanho da bancada do estado (ADR 0020). */
export function maxGuessesFor(stateSize: number): number {
  if (stateSize <= 10) return 6;
  if (stateSize <= 30) return 8;
  return 10;
}

/** Sugestões do autocompletar: nomes que contêm o texto digitado, ignorando acentos. */
export function searchNames<T extends { name: string }>(
  items: readonly T[],
  query: string,
  exclude: ReadonlySet<string> = new Set(),
  limit = 8,
): T[] {
  const q = foldText(query);
  if (!q) return [];
  const starts: T[] = [];
  const contains: T[] = [];
  for (const item of items) {
    if (exclude.has(item.name)) continue;
    const name = foldText(item.name);
    if (name.startsWith(q) || name.split(/\s+/).some((part) => part.startsWith(q)))
      starts.push(item);
    else if (name.includes(q)) contains.push(item);
  }
  return [...starts, ...contains].slice(0, limit);
}
