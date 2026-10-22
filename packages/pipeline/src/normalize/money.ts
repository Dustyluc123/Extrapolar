// Caderno 6: reduz a cota parlamentar por deputado e liga autores de emendas (CGU) a deputados.
// Regras em docs/METODOLOGIA.md (#cota, #emendas) e ADRs 0017 e 0018.
import type { CamaraCeapRow, CguAmendmentRow } from "@extrapolar/shared";
import type { AmendmentRow, CeapEntry } from "@extrapolar/metrics";

export interface DeputyCeap {
  entries: CeapEntry[];
  restitutions: number;
}

/** Soma o valor líquido por deputado, mês de competência e categoria. Lideranças (sem id) ficam fora. */
export function reduceCeap(
  target: Map<number, DeputyCeap>,
  rows: readonly CamaraCeapRow[],
  deputyIds: ReadonlySet<number>,
): void {
  const sums = new Map<number, Map<string, CeapEntry>>();
  for (const row of rows) {
    if (row.ideCadastro === "") continue;
    const deputyId = Number(row.ideCadastro);
    if (!deputyIds.has(deputyId)) continue;
    const month = `${row.numAno}-${row.numMes.padStart(2, "0")}`;
    const category = row.txtDescricao.trim();
    let byKey = sums.get(deputyId);
    if (!byKey) sums.set(deputyId, (byKey = new Map()));
    const key = `${month}|${category}`;
    const entry = byKey.get(key) ?? { month, category, value: 0 };
    entry.value += Number(row.vlrLiquido);
    byKey.set(key, entry);
    if (row.vlrRestituicao !== "") {
      const t = target.get(deputyId) ?? { entries: [], restitutions: 0 };
      t.restitutions += Number(row.vlrRestituicao);
      target.set(deputyId, t);
    }
  }
  for (const [deputyId, byKey] of sums) {
    const t = target.get(deputyId) ?? { entries: [], restitutions: 0 };
    for (const entry of byKey.values()) t.entries.push(entry);
    target.set(deputyId, t);
  }
}

/** Normaliza nomes para comparar: sem acento, minúsculas, sem pontuação e sem o prefixo "Dep.". */
export function normalizeAuthorName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.\-'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(dep|deputad[oa]) /, "");
}

export interface AuthorLink {
  code: string;
  name: string;
  via: "nome" | "manual";
}

export interface AuthorLinking {
  links: Map<number, AuthorLink>;
  /** Autores de emendas individuais nos anos considerados que não foram ligados a deputado atual. */
  unlinkedAuthors: { code: string; name: string }[];
}

/**
 * Liga autores (CGU) a deputados: correspondência manual primeiro; senão, nome normalizado igual
 * e único dos dois lados (considerando autores de todos os anos da base). Nunca por semelhança.
 */
export function linkAmendmentAuthors(input: {
  rows: readonly CguAmendmentRow[];
  deputies: readonly { id: number; name: string }[];
  manual: Readonly<Record<number, string | null>>;
  years: readonly number[];
}): AuthorLinking {
  const authors = new Map<string, string>();
  for (const row of input.rows) {
    const code = row["Código do Autor da Emenda"];
    if (code === "S/I" || code === "") continue;
    authors.set(code, row["Nome do Autor da Emenda"]);
  }
  const authorsByName = new Map<string, string[]>();
  for (const [code, name] of authors) {
    const key = normalizeAuthorName(name);
    authorsByName.set(key, [...(authorsByName.get(key) ?? []), code]);
  }
  const deputiesByName = new Map<string, number[]>();
  for (const d of input.deputies) {
    const key = normalizeAuthorName(d.name);
    deputiesByName.set(key, [...(deputiesByName.get(key) ?? []), d.id]);
  }

  const links = new Map<number, AuthorLink>();
  for (const deputy of input.deputies) {
    if (deputy.id in input.manual) {
      const code = input.manual[deputy.id];
      if (code) links.set(deputy.id, { code, name: authors.get(code) ?? code, via: "manual" });
      continue;
    }
    const key = normalizeAuthorName(deputy.name);
    const codes = authorsByName.get(key) ?? [];
    if (codes.length === 1 && deputiesByName.get(key)?.length === 1) {
      const code = codes[0] as string;
      links.set(deputy.id, { code, name: authors.get(code) as string, via: "nome" });
    }
  }

  const linkedCodes = new Set([...links.values()].map((l) => l.code));
  const years = new Set(input.years.map(String));
  const unlinked = new Map<string, string>();
  for (const row of input.rows) {
    const code = row["Código do Autor da Emenda"];
    if (!years.has(row["Ano da Emenda"]) || !row["Tipo de Emenda"].startsWith("Emenda Individual"))
      continue;
    if (code === "S/I" || linkedCodes.has(code)) continue;
    unlinked.set(code, row["Nome do Autor da Emenda"]);
  }
  return {
    links,
    unlinkedAuthors: [...unlinked]
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const money = (value: string) => Number(value.replace(",", "."));

/** Linhas de emendas por código de autor, convertidas (só os anos considerados). */
export function amendmentRowsByAuthor(
  rows: readonly CguAmendmentRow[],
  years: readonly number[],
): Map<string, AmendmentRow[]> {
  const yearSet = new Set(years);
  const result = new Map<string, AmendmentRow[]>();
  for (const row of rows) {
    const year = Number(row["Ano da Emenda"]);
    if (!yearSet.has(year)) continue;
    const code = row["Código do Autor da Emenda"];
    const list = result.get(code) ?? [];
    list.push({
      year,
      type: row["Tipo de Emenda"],
      location: row["Localidade de aplicação do recurso"],
      committed: money(row["Valor Empenhado"]),
      liquidated: money(row["Valor Liquidado"]),
      paid: money(row["Valor Pago"]),
      carriedPaid: money(row["Valor Restos A Pagar Pagos"]),
    });
    result.set(code, list);
  }
  return result;
}
