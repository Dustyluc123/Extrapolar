import { describe, expect, it } from "vitest";
import { computeAlignment, type AlignmentEntry } from "../src/index";

const v = (value: "yes" | "no" | "abstention" | "obstruction") =>
  ({ kind: "value", value }) as const;

describe("computeAlignment", () => {
  it("conta votos iguais à orientação", () => {
    const entries: AlignmentEntry[] = [
      { ballot: "yes", orientation: v("yes") },
      { ballot: "no", orientation: v("yes") },
      { ballot: "obstruction", orientation: v("obstruction") },
      { ballot: "abstention", orientation: v("no") },
    ];
    expect(computeAlignment(entries)).toMatchObject({
      comparableVotes: 4,
      alignedVotes: 2,
      rate: 0.5,
    });
  });

  it("liberado, sem orientação, só bloco e Art. 17/secreto ficam fora e são contados", () => {
    const result = computeAlignment([
      { ballot: "yes", orientation: { kind: "free" } },
      { ballot: "yes", orientation: { kind: "none" } },
      { ballot: "no", orientation: { kind: "bloc-only" } },
      { ballot: "article17", orientation: v("yes") },
      { ballot: "secret", orientation: v("yes") },
      { ballot: "yes", orientation: v("yes") },
    ]);
    expect(result).toEqual({
      comparableVotes: 1,
      alignedVotes: 1,
      rate: 1,
      excluded: { free: 1, noOrientation: 1, blocOnly: 1, ballotNotComparable: 2 },
    });
  });

  it("sem votação comparável a taxa é null, não zero", () => {
    expect(computeAlignment([{ ballot: "yes", orientation: { kind: "free" } }]).rate).toBeNull();
    expect(computeAlignment([]).rate).toBeNull();
  });
});
