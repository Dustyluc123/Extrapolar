import { describe, expect, it } from "vitest";
import type { GameVote } from "@extrapolar/shared";
import { isNearUnanimous, orientationChar, selectRound } from "../src/steps/games/vote-round";

const vote = (
  id: string,
  date: string,
  propositionId: number,
  yes: number,
  no: number,
): GameVote => ({
  id,
  date,
  proposition: { id: propositionId, label: `PL ${propositionId}/2026`, summary: "Ementa." },
  plainSummary: null,
  object: "Projeto de Lei",
  turn: null,
  approved: true,
  official: { yes, no, others: 0 },
  counts: { yes, no, abstention: 0, obstruction: 0, article17: 0 },
});

describe("rodada do Vote você também", () => {
  it("quase unânime: lado menor com menos de 10% dos votos Sim + Não", () => {
    expect(isNearUnanimous(vote("a", "2026-01-01", 1, 461, 4))).toBe(true);
    expect(isNearUnanimous(vote("a", "2026-01-01", 1, 300, 40))).toBe(false);
    expect(isNearUnanimous(vote("a", "2026-01-01", 1, 0, 0))).toBe(true);
  });

  it("10 mais recentes antes da segunda-feira, uma por proposição, sem quase unânimes", () => {
    const votes = [
      ...Array.from({ length: 12 }, (_, i) =>
        vote(`v${i}`, `2026-09-${String(i + 1).padStart(2, "0")}`, 100 + i, 300, 100),
      ),
      vote("dup-old", "2026-09-20", 111, 300, 120), // mesma proposição da v11: a mais recente vence
      vote("unan", "2026-09-21", 500, 460, 3),
      vote("next-week", "2026-10-20", 600, 300, 100),
    ];
    const round = selectRound(votes, "2026-10-19");
    expect(round).toHaveLength(10);
    expect(round.map((v) => v.id)).not.toContain("unan");
    expect(round.map((v) => v.id)).not.toContain("next-week");
    expect(round.map((v) => v.id)).toContain("dup-old");
    expect(round.map((v) => v.id)).not.toContain("v11");
    expect(round.at(-1)!.id).toBe("dup-old"); // da mais antiga para a mais recente
  });

  it("proposição cuja votação mais recente é quase unânime fica fora (não volta a anterior)", () => {
    const round = selectRound(
      [vote("old", "2026-09-01", 7, 300, 100), vote("new", "2026-09-02", 7, 460, 2)],
      "2026-10-19",
    );
    expect(round).toEqual([]);
  });

  it("orientação compacta", () => {
    expect(orientationChar({ kind: "value", value: "yes" })).toBe("S");
    expect(orientationChar({ kind: "value", value: "obstruction" })).toBe("O");
    expect(orientationChar({ kind: "free" })).toBe("L");
    expect(orientationChar({ kind: "bloc-only" })).toBe("B");
    expect(orientationChar({ kind: "none" })).toBe("-");
  });
});
