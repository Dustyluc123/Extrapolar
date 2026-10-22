// Mede quanto o repositório cresceria com a mudança atual em data/generated
// (o que o commit diário do pipeline vai gravar). Uso: depois de `pnpm pipeline`,
//   node scripts/repo-growth.mjs
// Conta os arquivos novos ou alterados em relação ao último commit e soma o tamanho
// comprimido (zlib, como o Git guarda objetos novos). É uma estimativa por cima: o Git
// ainda compacta diferenças entre versões ao empacotar.
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

const changed = git("status", "--porcelain", "--untracked-files=all", "--", "data/generated")
  .split("\n")
  .filter(Boolean)
  .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }));

let raw = 0;
let compressed = 0;
let removed = 0;
for (const { status, path } of changed) {
  if (status === "D") {
    removed++;
    continue;
  }
  const content = readFileSync(join(ROOT, path));
  raw += statSync(join(ROOT, path)).size;
  compressed += deflateSync(content).length;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const total = git("ls-files", "data/generated").split("\n").filter(Boolean).length;
console.log(
  `data/generated: ${changed.length - removed} arquivo(s) novo(s) ou alterado(s) de ${total}, ${removed} removido(s)`,
);
console.log(`tamanho sem compressão: ${kb(raw)}`);
console.log(`crescimento estimado do repositório (comprimido): ${kb(compressed)}`);
