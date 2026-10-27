// Lista de palavras de julgamento, usada por scripts/check-neutrality.mjs e pela página de
// revisão dos resumos (só em `pnpm dev`).

/**
 * Palavras de julgamento (comparadas sem acento e sem diferença de maiúsculas).
 * Cada entrada é o começo da palavra: "corrupt" pega corrupto, corrupta, corrupção.
 */
export const JUDGMENT_WORDS = [
  "melhor",
  "pior",
  "corrupt",
  "corrupcao",
  "vergonh",
  "heroi",
  "heroin",
  "pessim",
  "excelent",
  "ruim",
  "ruins",
  "bandid",
  "ladra",
  "ladrao",
  "ladroes",
  "mentiros",
  "incompetent",
  "vagabund",
  "golpista",
  "traidor",
  "traira",
  "fantasma",
  "vilao",
  "viloes",
];

/** Tira acentos e maiúsculas para comparar. */
export const fold = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Palavras de julgamento encontradas num texto. */
export function judgmentWords(text) {
  const pattern = new RegExp(`\\b(${JUDGMENT_WORDS.join("|")})[a-z]*`, "g");
  return [...fold(text).matchAll(pattern)].map((m) => m[0]);
}
