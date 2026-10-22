import { describe, expect, it } from "vitest";
import {
  quarterOf,
  quartersBetween,
  summarizeOversight,
  type OversightProposition,
} from "../src/index";

describe("trimestres", () => {
  it("calcula o trimestre de uma data", () => {
    expect(quarterOf("2023-02-01")).toBe("2023-T1");
    expect(quarterOf("2023-04-30")).toBe("2023-T2");
    expect(quarterOf("2026-10-22")).toBe("2026-T4");
  });

  it("lista os trimestres do intervalo", () => {
    expect(quartersBetween("2023-02-01", "2023-11-10")).toEqual([
      "2023-T1",
      "2023-T2",
      "2023-T3",
      "2023-T4",
    ]);
    expect(quartersBetween("2023-02-01", "2024-01-05")).toHaveLength(5);
  });
});

describe("summarizeOversight", () => {
  const list: OversightProposition[] = [
    { type: "RIC", codType: 148, date: "2023-03-10", role: "first" },
    { type: "RIC", codType: 148, date: "2023-05-10", role: "first" },
    { type: "RIC", codType: 148, date: "2023-05-11", role: "coauthor" },
    { type: "PFC", codType: 138, date: "2023-05-12", role: "first" },
    { type: "INC", codType: 133, date: "2023-06-01", role: "first" },
    { type: "REQ", codType: 523, date: "2023-06-01", role: "first" },
    { type: "REQ", codType: 356, date: "2023-06-02", role: "coauthor" },
    { type: "REQ", codType: 294, date: "2023-06-02", role: "first" }, // audiência: não é convocação
    { type: "RIC", codType: 148, date: "2023-06-03", role: "support" }, // apoio não conta
  ];
  const s = summarizeOversight(list, [523, 356, 150], ["2023-T1", "2023-T2"]);

  it("conta cada tipo separando autor principal e coautor", () => {
    expect(s.ric).toEqual({ first: 2, coauthor: 1 });
    expect(s.pfc).toEqual({ first: 1, coauthor: 0 });
    expect(s.indications).toEqual({ first: 1, coauthor: 0 });
    expect(s.convocations.first).toBe(1);
    expect(s.convocations.coauthor).toBe(1);
    expect(s.convocations.byCode).toEqual([
      { code: 523, first: 1, coauthor: 0 },
      { code: 356, first: 0, coauthor: 1 },
      { code: 150, first: 0, coauthor: 0 },
    ]);
  });

  it("série trimestral de RIC + PFC como autor principal", () => {
    expect(s.byQuarter).toEqual([
      { quarter: "2023-T1", count: 1 },
      { quarter: "2023-T2", count: 2 },
    ]);
  });
});
