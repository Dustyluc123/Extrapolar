import { describe, expect, it } from "vitest";
import { summarizeAmendments, type AmendmentRow } from "../src/index";

const row = (
  year: number,
  type: string,
  location: string,
  v: [number, number, number, number],
): AmendmentRow => ({
  year,
  type,
  location,
  committed: v[0],
  liquidated: v[1],
  paid: v[2],
  carriedPaid: v[3],
});

describe("summarizeAmendments", () => {
  const s = summarizeAmendments(
    [
      row(2024, "Individual - Finalidade Definida", "RECIFE - PE", [1000, 800, 600, 100]),
      row(2024, "Individual - Transferências Especiais", "OLINDA - PE", [500, 500, 500, 0]),
      row(2025, "Individual - Finalidade Definida", "RECIFE - PE", [2000, 0, 0, 0]),
      row(2023, "Individual - Finalidade Definida", "RECIFE - PE", [9999, 0, 0, 0]), // fora dos anos
    ],
    [2024, 2025, 2026, 2027],
  );

  it("soma por ano só nos orçamentos considerados", () => {
    expect(s.byYear.map((y) => [y.year, y.committed])).toEqual([
      [2024, 1500],
      [2025, 2000],
      [2026, 0],
      [2027, 0],
    ]);
    expect(s.total).toEqual({ committed: 3500, liquidated: 1300, paid: 1100, carriedPaid: 100 });
  });

  it("execução = (pago + restos a pagar pagos) ÷ empenhado", () => {
    expect(s.execution).toBeCloseTo(1200 / 3500);
  });

  it("por tipo e principais destinos por empenho", () => {
    expect(s.byType.map((t) => [t.type, t.committed])).toEqual([
      ["Individual - Finalidade Definida", 3000],
      ["Individual - Transferências Especiais", 500],
    ]);
    expect(s.topLocations).toEqual([
      { location: "RECIFE - PE", committed: 3000 },
      { location: "OLINDA - PE", committed: 500 },
    ]);
  });

  it("sem empenho, execução é null", () => {
    expect(summarizeAmendments([], [2024]).execution).toBeNull();
  });
});
