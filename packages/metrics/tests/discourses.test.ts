import { describe, expect, it } from "vitest";
import { summarizeDiscourses, type Discourse } from "../src/index";

const d = (date: string, phase: string | null, type = "PELA ORDEM"): Discourse => ({
  date,
  phase,
  type,
});

describe("summarizeDiscourses", () => {
  const list = [
    d("2023-01-20T10:00", "Ordem do Dia"), // antes da legislatura
    d("2023-03-01T10:00", "Ordem do Dia"),
    d("2024-05-01T10:00", "Breves Comunicações", "BREVES COMUNICAÇÕES"),
    d("2024-06-01T10:00", null),
    d("2026-09-02T11:36", "Ordem do Dia"),
  ];
  const s = summarizeDiscourses(list, [2023, 2024, 2025, 2026], "2023-02-01");

  it("conta só a partir do início da legislatura, por ano", () => {
    expect(s.total).toBe(4);
    expect(s.byYear).toEqual([
      { year: 2023, count: 1 },
      { year: 2024, count: 2 },
      { year: 2025, count: 0 },
      { year: 2026, count: 1 },
    ]);
  });

  it("agrupa por fase (fase vazia tem nome próprio) e por tipo", () => {
    expect(s.byPhase).toEqual([
      { phase: "Ordem do Dia", count: 2 },
      { phase: "Breves Comunicações", count: 1 },
      { phase: "Fase não informada", count: 1 },
    ]);
    expect(s.byType[0]).toEqual({ type: "PELA ORDEM", count: 3 });
  });

  it("informa a data do discurso mais recente", () => {
    expect(s.last).toBe("2026-09-02T11:36");
    expect(summarizeDiscourses([], [2023], "2023-02-01").last).toBeNull();
  });
});
