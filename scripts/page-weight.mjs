#!/usr/bin/env node
// Peso das páginas no build (apps/web/dist): HTML + CSS + JS que a página carrega,
// seguindo os imports estáticos dos módulos. Mostra bruto e gzip, em KB.
// Uso: node scripts/page-weight.mjs [/jogos/dle /ranking ...]
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = resolve("apps/web/dist");
const DEFAULT_PAGES = [
  "/jogos",
  "/jogos/dle",
  "/jogos/placar",
  "/jogos/vote-voce-tambem",
  "/jogos/seja-deputado",
  "/ranking",
  "/sobre",
];
const pages = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_PAGES;

function fileFor(urlPath) {
  const clean = urlPath.split("?")[0].replace(/^\//, "");
  return join(DIST, clean);
}

function collectJs(file, seen) {
  if (seen.has(file) || !existsSync(file)) return;
  seen.add(file);
  const code = readFileSync(file, "utf8");
  // import "./x.js", import{a}from"./x.js", import("./x.js") (só os estáticos contam no peso inicial)
  const re = /(?:^|[;\s}])import\s*(?:[^"'()]*?from\s*)?["']([^"']+\.js)["']/g;
  for (const m of code.matchAll(re)) {
    const ref = m[1];
    const next = ref.startsWith("/") ? fileFor(ref) : join(dirname(file), ref);
    collectJs(next, seen);
  }
}

const kb = (n) => (n / 1024).toFixed(1);
const rows = [];
for (const page of pages) {
  const htmlFile = join(DIST, page.replace(/^\//, ""), "index.html");
  if (!existsSync(htmlFile)) {
    rows.push({ page, erro: "sem build" });
    continue;
  }
  const html = readFileSync(htmlFile);
  const text = html.toString("utf8");
  const css = new Set();
  const js = new Set();
  for (const m of text.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)) css.add(fileFor(m[1]));
  for (const m of text.matchAll(/(?:src|component-url|renderer-url)="(\/_astro\/[^"]+\.js)"/g))
    collectJs(fileFor(m[1]), js);
  for (const m of text.matchAll(/import\s*["'](\/_astro\/[^"']+\.js)["']/g))
    collectJs(fileFor(m[1]), js);
  const sum = (files) => {
    let raw = 0;
    let gz = 0;
    for (const f of files) {
      const buf = readFileSync(f);
      raw += buf.length;
      gz += gzipSync(buf).length;
    }
    return { raw, gz };
  };
  const h = { raw: html.length, gz: gzipSync(html).length };
  const c = sum(css);
  const j = sum(js);
  rows.push({
    page,
    "html gz": kb(h.gz),
    "css gz": kb(c.gz),
    "js gz": kb(j.gz),
    "total gz": kb(h.gz + c.gz + j.gz),
    "total bruto": kb(h.raw + c.raw + j.raw),
  });
}
console.table(rows);
