// Cota parlamentar (CEAP) — Caderno 6: funções puras.
// Regras em docs/METODOLOGIA.md#cota.
import type { ServicePeriod } from "@extrapolar/shared";

export interface CeapEntry {
  /** Mês de competência (AAAA-MM). */
  month: string;
  category: string;
  /** Valor líquido debitado da cota (pode ser negativo: compensação de passagens). */
  value: number;
}

export interface CeilingYear {
  year: number;
  /** Meses considerados: em exercício e com teto oficial conhecido. */
  months: string[];
  spent: number;
  ceiling: number;
  share: number;
}

export interface CeapSummary {
  total: number;
  byYear: { year: number; value: number }[];
  byMonth: { month: string; value: number }[];
  byCategory: { category: string; value: number }[];
  ceilingByYear: CeilingYear[];
}

const cents = (value: number) => Math.round(value * 100) / 100;

/** Meses (AAAA-MM) entre `from` e `to` (inclusive). */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const end = to.slice(0, 7);
  for (;;) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (key > end) return months;
    months.push(key);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

/** Meses em que o deputado esteve em exercício pelo menos um dia. */
export function monthsInService(
  periods: readonly ServicePeriod[],
  from: string,
  referenceDateTime: string,
): string[] {
  const set = new Set<string>();
  for (const period of periods) {
    const start = period.start.slice(0, 10) < from ? from : period.start.slice(0, 10);
    const end = (period.end ?? referenceDateTime).slice(0, 10);
    if (end < start) continue;
    for (const month of monthsBetween(start, end)) set.add(month);
  }
  return [...set].sort();
}

export function summarizeCeap(input: {
  entries: readonly CeapEntry[];
  /** Todos os meses da legislatura até a referência (eixo do gráfico). */
  months: readonly string[];
  serviceMonths: readonly string[];
  ceilingFor: (month: string) => number | null;
}): CeapSummary {
  const monthSet = new Set(input.months);
  const byMonth = new Map<string, number>(input.months.map((m) => [m, 0]));
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const entry of input.entries) {
    if (!monthSet.has(entry.month)) continue;
    total += entry.value;
    byMonth.set(entry.month, (byMonth.get(entry.month) ?? 0) + entry.value);
    byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.value);
  }

  const years = [...new Set(input.months.map((m) => Number(m.slice(0, 4))))];
  const byYear = years.map((year) => ({
    year,
    value: cents(
      [...byMonth.entries()]
        .filter(([m]) => Number(m.slice(0, 4)) === year)
        .reduce((sum, [, v]) => sum + v, 0),
    ),
  }));

  const service = new Set(input.serviceMonths);
  const ceilingByYear: CeilingYear[] = [];
  for (const year of years) {
    const months = input.months.filter(
      (m) => Number(m.slice(0, 4)) === year && service.has(m) && input.ceilingFor(m) !== null,
    );
    if (months.length === 0) continue;
    const ceiling = months.reduce((sum, m) => sum + (input.ceilingFor(m) ?? 0), 0);
    const spent = months.reduce((sum, m) => sum + (byMonth.get(m) ?? 0), 0);
    ceilingByYear.push({
      year,
      months,
      spent: cents(spent),
      ceiling: cents(ceiling),
      share: ceiling > 0 ? spent / ceiling : 0,
    });
  }

  return {
    total: cents(total),
    byYear,
    byMonth: [...byMonth.entries()].map(([month, value]) => ({ month, value: cents(value) })),
    byCategory: [...byCategory.entries()]
      .map(([category, value]) => ({ category, value: cents(value) }))
      .sort((a, b) => b.value - a.value || a.category.localeCompare(b.category)),
    ceilingByYear,
  };
}
