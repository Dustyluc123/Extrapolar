import { describe, expect, it } from "vitest";
import { EMPTY_STATS, currentStreak, parseStats, recordDay } from "../src/index";

describe("sequência e estatísticas", () => {
  it("dias seguidos completos aumentam a sequência", () => {
    let s = recordDay(EMPTY_STATS, "2026-10-20", true, "3");
    s = recordDay(s, "2026-10-21", true, "4");
    expect(s.streak).toBe(2);
    expect(s.maxStreak).toBe(2);
    expect(s.distribution).toEqual({ "3": 1, "4": 1 });
  });

  it("pular um dia recomeça em 1; dia incompleto zera", () => {
    let s = recordDay(EMPTY_STATS, "2026-10-20", true);
    s = recordDay(s, "2026-10-22", true);
    expect(s.streak).toBe(1);
    s = recordDay(s, "2026-10-23", false);
    expect(s.streak).toBe(0);
    expect(s.maxStreak).toBe(1);
    expect(s.played).toBe(3);
    expect(s.completed).toBe(2);
  });

  it("registrar o mesmo dia de novo não muda nada", () => {
    const s = recordDay(EMPTY_STATS, "2026-10-20", true);
    expect(recordDay(s, "2026-10-20", true)).toBe(s);
  });

  it("sequência vale hoje só se o último dia foi hoje ou ontem", () => {
    const s = recordDay(EMPTY_STATS, "2026-10-20", true);
    expect(currentStreak(s, "2026-10-21")).toBe(1);
    expect(currentStreak(s, "2026-10-22")).toBe(0);
  });

  it("dado salvo estranho vira estatística vazia, sem quebrar", () => {
    expect(parseStats("lixo")).toEqual(EMPTY_STATS);
    expect(parseStats({ played: -3, lastDate: "ontem" })).toEqual(EMPTY_STATS);
  });
});
