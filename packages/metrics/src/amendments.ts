// Emendas parlamentares (Caderno 6): função pura que resume as emendas de um autor.
// Regras em docs/METODOLOGIA.md#emendas.

export interface AmendmentValues {
  committed: number; // empenhado
  liquidated: number; // liquidado
  paid: number; // pago
  carriedPaid: number; // restos a pagar pagos
}

export interface AmendmentRow extends AmendmentValues {
  year: number;
  type: string;
  location: string;
}

export interface AmendmentsSummary {
  byYear: (AmendmentValues & { year: number })[];
  total: AmendmentValues;
  /** (pago + restos a pagar pagos) ÷ empenhado; null sem empenho. */
  execution: number | null;
  byType: (AmendmentValues & { type: string })[];
  topLocations: { location: string; committed: number }[];
}

const zero = (): AmendmentValues => ({ committed: 0, liquidated: 0, paid: 0, carriedPaid: 0 });
const cents = (v: number) => Math.round(v * 100) / 100;
const round = (v: AmendmentValues): AmendmentValues => ({
  committed: cents(v.committed),
  liquidated: cents(v.liquidated),
  paid: cents(v.paid),
  carriedPaid: cents(v.carriedPaid),
});
function add(target: AmendmentValues, row: AmendmentValues) {
  target.committed += row.committed;
  target.liquidated += row.liquidated;
  target.paid += row.paid;
  target.carriedPaid += row.carriedPaid;
}

export function summarizeAmendments(
  rows: readonly AmendmentRow[],
  years: readonly number[],
  topLimit = 5,
): AmendmentsSummary {
  const yearSet = new Set(years);
  const byYear = new Map<number, AmendmentValues>(years.map((y) => [y, zero()]));
  const byType = new Map<string, AmendmentValues>();
  const byLocation = new Map<string, number>();
  const total = zero();
  for (const row of rows) {
    if (!yearSet.has(row.year)) continue;
    add(total, row);
    add(byYear.get(row.year) as AmendmentValues, row);
    const type = byType.get(row.type) ?? zero();
    add(type, row);
    byType.set(row.type, type);
    byLocation.set(row.location, (byLocation.get(row.location) ?? 0) + row.committed);
  }
  const paidTotal = total.paid + total.carriedPaid;
  return {
    byYear: [...byYear.entries()].map(([year, v]) => ({ year, ...round(v) })),
    total: round(total),
    execution: total.committed > 0 ? paidTotal / total.committed : null,
    byType: [...byType.entries()]
      .map(([type, v]) => ({ type, ...round(v) }))
      .sort((a, b) => b.committed - a.committed || a.type.localeCompare(b.type)),
    topLocations: [...byLocation.entries()]
      .map(([location, committed]) => ({ location, committed: cents(committed) }))
      .filter((l) => l.committed > 0)
      .sort((a, b) => b.committed - a.committed || a.location.localeCompare(b.location))
      .slice(0, topLimit),
  };
}
