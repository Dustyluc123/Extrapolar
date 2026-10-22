import { describe, expect, it } from "vitest";
import {
  classifySituation,
  summarizeOpinions,
  summarizePropositions,
  type AuthoredProposition,
} from "../src/index";

const YEARS = [2023, 2024, 2025, 2026];

function prop(
  id: number,
  type: string,
  role: AuthoredProposition["role"],
  extra: Partial<AuthoredProposition> = {},
): AuthoredProposition {
  return { id, type, role, date: "2024-05-10", situationId: "915", themes: [], ...extra };
}

describe("classifySituation", () => {
  it("agrupa os códigos oficiais", () => {
    expect(classifySituation("1140")).toBe("norma");
    expect(classifySituation("926")).toBe("aprovada-fora");
    expect(classifySituation("925")).toBe("apensada");
    expect(classifySituation("923")).toBe("arquivada");
    expect(classifySituation("950")).toBe("devolvida-retirada");
    expect(classifySituation("907")).toBe("em-tramitacao");
    expect(classifySituation("")).toBe("sem-situacao");
    expect(classifySituation("9999")).toBe("outra");
  });
});

describe("summarizePropositions", () => {
  const list: AuthoredProposition[] = [
    prop(1, "PL", "first", { situationId: "1140", themes: [56, 72], date: "2023-03-01" }),
    prop(2, "PL", "first", { situationId: "925", themes: [56] }),
    prop(3, "PEC", "first", { situationId: "", themes: [] }),
    prop(4, "PL", "coauthor"),
    prop(5, "PDL", "support"),
    prop(6, "REQ", "first"), // não é tipo principal
  ];
  const s = summarizePropositions(list, YEARS);

  it("separa autor principal, coautoria e apoio, só nos tipos principais", () => {
    expect(s.totalFirst).toBe(3);
    expect(s.totalCoauthor).toBe(1);
    expect(s.totalSupport).toBe(1);
    expect(s.byType).toEqual([
      { type: "PL", first: 2, coauthor: 1 },
      { type: "PLP", first: 0, coauthor: 0 },
      { type: "PEC", first: 1, coauthor: 0 },
      { type: "PDL", first: 0, coauthor: 0 },
      { type: "PRC", first: 0, coauthor: 0 },
    ]);
  });

  it("conta por ano e por situação, com taxa de conversão", () => {
    expect(s.byYear).toEqual([
      { year: 2023, first: 1 },
      { year: 2024, first: 2 },
      { year: 2025, first: 0 },
      { year: 2026, first: 0 },
    ]);
    expect(s.situations).toEqual([
      { category: "norma", count: 1 },
      { category: "apensada", count: 1 },
      { category: "sem-situacao", count: 1 },
    ]);
    expect(s.becameLaw).toBe(1);
    expect(s.conversionRate).toBeCloseTo(1 / 3);
  });

  it("temas oficiais com homenagens separadas", () => {
    expect(s.withTheme).toBe(2);
    expect(s.homage).toBe(1);
    expect(s.themes).toEqual([
      { code: 56, count: 2 },
      { code: 72, count: 1 },
    ]);
  });

  it("sem projeto como autor principal a taxa é null", () => {
    expect(summarizePropositions([prop(1, "PL", "coauthor")], YEARS).conversionRate).toBeNull();
  });
});

describe("summarizeOpinions", () => {
  it("conta pareceres por ano e por órgão", () => {
    expect(
      summarizeOpinions(
        [
          { date: "2023-05-01", organ: "CCJC" },
          { date: "2024-05-01", organ: "CCJC" },
          { date: "2024-06-01", organ: "MESA" },
        ],
        YEARS,
      ),
    ).toEqual({
      total: 3,
      byYear: [
        { year: 2023, count: 1 },
        { year: 2024, count: 2 },
        { year: 2025, count: 0 },
        { year: 2026, count: 0 },
      ],
      byOrgan: [
        { organ: "CCJC", count: 2 },
        { organ: "MESA", count: 1 },
      ],
    });
  });
});
