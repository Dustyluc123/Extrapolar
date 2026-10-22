import { describe, expect, it } from "vitest";
import { monthsBetween, monthsInService, summarizeCeap } from "../src/index";

describe("meses", () => {
  it("lista meses entre duas datas", () => {
    expect(monthsBetween("2023-11-15", "2024-02-01")).toEqual([
      "2023-11",
      "2023-12",
      "2024-01",
      "2024-02",
    ]);
  });

  it("meses em exercício (pelo menos um dia), a partir do início da legislatura", () => {
    expect(
      monthsInService(
        [
          { start: "2023-02-01T12:00:00", end: "2023-03-02T10:00:00" },
          { start: "2023-06-30T15:00:00", end: null },
        ],
        "2023-02-01",
        "2023-08-10T00:00:00",
      ),
    ).toEqual(["2023-02", "2023-03", "2023-06", "2023-07", "2023-08"]);
  });
});

describe("summarizeCeap", () => {
  const months = ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];
  const ceilingFor = (m: string) => (m >= "2026-03" ? 50000 : null);
  const s = summarizeCeap({
    entries: [
      { month: "2025-12", category: "TELEFONIA", value: 100.1 },
      { month: "2026-03", category: "COMBUSTÍVEIS", value: 20000 },
      { month: "2026-03", category: "PASSAGEM AÉREA", value: -500 }, // compensação
      { month: "2026-04", category: "COMBUSTÍVEIS", value: 9500.25 },
      { month: "2022-12", category: "TELEFONIA", value: 999 }, // fora da legislatura
    ],
    months,
    serviceMonths: ["2025-12", "2026-01", "2026-02", "2026-03"],
    ceilingFor,
  });

  it("soma o valor líquido, inclusive negativos, só nos meses da legislatura", () => {
    expect(s.total).toBe(29100.35);
    expect(s.byYear).toEqual([
      { year: 2025, value: 100.1 },
      { year: 2026, value: 29000.25 },
    ]);
    expect(s.byCategory[0]).toEqual({ category: "COMBUSTÍVEIS", value: 29500.25 });
    expect(s.byMonth.find((m) => m.month === "2026-01")?.value).toBe(0);
  });

  it("% do teto só em meses com teto oficial e em exercício", () => {
    // abril tem teto, mas o deputado não estava em exercício: fica fora
    expect(s.ceilingByYear).toEqual([
      { year: 2026, months: ["2026-03"], spent: 19500, ceiling: 50000, share: 0.39 },
    ]);
  });

  it("sem teto oficial, não há comparação", () => {
    const none = summarizeCeap({
      entries: [],
      months,
      serviceMonths: months,
      ceilingFor: () => null,
    });
    expect(none.ceilingByYear).toEqual([]);
  });
});
