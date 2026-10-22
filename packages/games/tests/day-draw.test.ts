import { describe, expect, it } from "vitest";
import {
  addDays,
  brasiliaDateKey,
  dailyNumber,
  dailyPick,
  daysBetween,
  msUntilNextDay,
  scramble,
  unscramble,
  updateRoster,
  weekStart,
  type RosterEntry,
} from "../src/index";

describe("dia de Brasília", () => {
  it("vira à meia-noite de Brasília, não à de Greenwich", () => {
    // 02:59 UTC = 23:59 em Brasília do dia anterior
    expect(brasiliaDateKey(new Date("2026-10-23T02:59:00Z"))).toBe("2026-10-22");
    expect(brasiliaDateKey(new Date("2026-10-23T03:00:00Z"))).toBe("2026-10-23");
  });

  it("soma e conta dias atravessando meses e anos", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });

  it("segunda-feira da semana", () => {
    expect(weekStart("2026-10-22")).toBe("2026-10-19"); // quinta
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // segunda
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // domingo
  });

  it("número do desafio começa em 1 e não fica negativo antes do lançamento", () => {
    expect(dailyNumber("2026-10-23", "2026-10-23")).toBe(1);
    expect(dailyNumber("2026-10-30", "2026-10-23")).toBe(8);
    expect(dailyNumber("2026-10-01", "2026-10-23")).toBe(1);
  });

  it("tempo até a próxima meia-noite de Brasília", () => {
    expect(msUntilNextDay(new Date("2026-10-23T02:00:00Z"))).toBe(3_600_000);
  });
});

const rank = (cycle: number, id: string) =>
  `${(cycle * 7 + id.charCodeAt(0) * 13) % 97}`.padStart(3, "0");

describe("sorteio diário", () => {
  const roster: RosterEntry[] = ["a", "b", "c", "d"].map((id) => ({ id, since: "2026-10-01" }));

  it("passa por todos os itens sem repetir dentro de um ciclo", () => {
    const days = [0, 1, 2, 3].map((i) =>
      dailyPick({ dateKey: addDays("2026-10-01", i), roster, rank }),
    );
    expect(new Set(days).size).toBe(4);
  });

  it("é o mesmo para todo mundo no mesmo dia", () => {
    const a = dailyPick({ dateKey: "2026-10-10", roster, rank });
    const b = dailyPick({ dateKey: "2026-10-10", roster, rank });
    expect(a).toBe(b);
  });

  it("antes do início não há sorteio", () => {
    expect(dailyPick({ dateKey: "2026-09-30", roster, rank })).toBeNull();
  });

  it("item novo não muda o ciclo em andamento", () => {
    const before = [0, 1, 2, 3].map((i) =>
      dailyPick({ dateKey: addDays("2026-10-01", i), roster, rank }),
    );
    const grown = updateRoster(roster, ["a", "b", "c", "d", "e"], "2026-10-02");
    const after = [0, 1, 2, 3].map((i) =>
      dailyPick({ dateKey: addDays("2026-10-01", i), roster: grown, rank }),
    );
    expect(after).toEqual(before);
    // No ciclo seguinte (5 dias), o novo aparece.
    const next = [4, 5, 6, 7, 8].map((i) =>
      dailyPick({ dateKey: addDays("2026-10-01", i), roster: grown, rank }),
    );
    expect(next).toContain("e");
  });

  it("item indisponível dá lugar ao próximo da ordem", () => {
    const today = dailyPick({ dateKey: "2026-10-01", roster, rank })!;
    const available = new Set(["a", "b", "c", "d"].filter((id) => id !== today));
    const replaced = dailyPick({ dateKey: "2026-10-01", roster, rank, available });
    expect(replaced).not.toBe(today);
    expect(available.has(replaced!)).toBe(true);
  });

  it("roster só cresce: quem saiu continua", () => {
    const updated = updateRoster(roster, ["a", "b"], "2026-10-05");
    expect(updated.map((e) => e.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("resposta embaralhada", () => {
  it("ida e volta com a mesma data, inclusive com acento", () => {
    const value = "204379|São Paulo";
    const encoded = scramble(value, "2026-10-22");
    expect(encoded).not.toContain("204379");
    expect(unscramble(encoded, "2026-10-22")).toBe(value);
  });

  it("com outra data não volta ao original", () => {
    expect(unscramble(scramble("204379", "2026-10-22"), "2026-10-23")).not.toBe("204379");
  });
});
