// Varredura de palavras de julgamento nos textos da interface (apps/web/src).
// Princípio de neutralidade: ver CLAUDE.md. Gera AVISO, nunca erro (sempre sai com código 0),
// porque palavras como "melhor" aparecem em frases normais ("para entender melhor").
// Exceções aprovadas ficam em scripts/neutrality-allowlist.json.
//
// Uso: pnpm check:neutralidade
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN_DIR = join(ROOT, "apps", "web", "src");
const EXTENSIONS = new Set([".astro", ".ts", ".tsx", ".md", ".mdx"]);
const ALLOWLIST_FILE = join(ROOT, "scripts", "neutrality-allowlist.json");

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

const fold = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const pattern = new RegExp(`\\b(${JUDGMENT_WORDS.join("|")})[a-z]*`, "g");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

async function loadAllowlist() {
  try {
    const list = JSON.parse(await readFile(ALLOWLIST_FILE, "utf8"));
    return list.map((item) => ({ ...item, foldedText: fold(item.text) }));
  } catch (error) {
    console.log(`Aviso: não foi possível ler ${ALLOWLIST_FILE}: ${error.message}`);
    return [];
  }
}

const allowlist = await loadAllowlist();
const findings = [];
let allowed = 0;

for (const file of await listFiles(SCAN_DIR)) {
  const path = relative(ROOT, file);
  const lines = (await readFile(file, "utf8")).split("\n");
  lines.forEach((line, index) => {
    const folded = fold(line);
    for (const match of folded.matchAll(pattern)) {
      const isAllowed = allowlist.some(
        (item) => item.file === path && folded.includes(item.foldedText),
      );
      if (isAllowed) {
        allowed++;
        continue;
      }
      findings.push({ path, line: index + 1, word: match[0], text: line.trim() });
    }
  });
}

const inActions = Boolean(process.env.GITHUB_ACTIONS);
for (const finding of findings) {
  const message = `Palavra de julgamento "${finding.word}": revise o texto ou adicione uma exceção em scripts/neutrality-allowlist.json`;
  if (inActions) {
    console.log(`::warning file=${finding.path},line=${finding.line}::${message}`);
  } else {
    console.log(`⚠ ${finding.path}:${finding.line}  "${finding.word}"\n    ${finding.text}`);
  }
}
console.log(
  findings.length === 0
    ? `Neutralidade: nenhuma palavra de julgamento encontrada em apps/web/src (${allowed} exceção(ões) aprovada(s)).`
    : `Neutralidade: ${findings.length} aviso(s). Isto não quebra o CI; revise cada caso.`,
);
