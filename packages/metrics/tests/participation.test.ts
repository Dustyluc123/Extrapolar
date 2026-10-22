import { describe, expect, it } from "vitest";
import {
  computeParticipation,
  computeParticipationForAll,
  isWithinServicePeriods,
  type BallotValue,
  type NominalVote,
} from "../src/index";

const REF = "2026-10-22T00:00:00";
const FULL_TERM = [{ start: "2023-02-01T12:05:00", end: null }];

/** Cria votações em dias seguidos de março de 2024, às 15h. */
function votes(count: number, month = "2024-03"): NominalVote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${month}-${i + 1}`,
    dateTime: `${month}-${String(i + 1).padStart(2, "0")}T15:00:00`,
  }));
}

function ballots(entries: Array<[string, BallotValue]>): Map<string, BallotValue> {
  return new Map(entries);
}

describe("computeParticipation", () => {
  it("deputado que votou em todas tem 100%", () => {
    const all = votes(4);
    const result = computeParticipation({
      deputyId: 1,
      votes: all,
      ballotsByVote: ballots(all.map((v) => [v.id, "yes"])),
      servicePeriods: FULL_TERM,
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({ eligibleVotes: 4, ballotsCast: 4, rate: 1 });
  });

  it("ausências reduzem a taxa e todos os tipos de voto (inclusive secreto) contam como participação", () => {
    const all = votes(10);
    const result = computeParticipation({
      deputyId: 1,
      votes: all,
      ballotsByVote: ballots([
        ["2024-03-1", "yes"],
        ["2024-03-2", "no"],
        ["2024-03-3", "abstention"],
        ["2024-03-4", "obstruction"],
        ["2024-03-5", "article17"],
        ["2024-03-6", "secret"],
      ]),
      servicePeriods: FULL_TERM,
      referenceDateTime: REF,
    });
    expect(result.eligibleVotes).toBe(10);
    expect(result.ballotsCast).toBe(6);
    expect(result.rate).toBe(0.6);
    expect(result.breakdown).toEqual({
      yes: 1,
      no: 1,
      abstention: 1,
      obstruction: 1,
      article17: 1,
      secret: 1,
    });
  });

  it("período parcial: suplente só é cobrado pelas votações enquanto estava em exercício", () => {
    // votações nos dias 1 a 10; em exercício do dia 6 (inclusive) em diante
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(10),
      ballotsByVote: ballots([
        ["2024-03-6", "yes"],
        ["2024-03-7", "yes"],
        ["2024-03-8", "yes"],
      ]),
      servicePeriods: [{ start: "2024-03-06T09:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({ eligibleVotes: 5, ballotsCast: 3, rate: 0.6 });
  });

  it("licença no meio do mandato: votações da licença não contam", () => {
    // em exercício dias 1–3 e 8–10; licença dias 4–7
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(10),
      ballotsByVote: ballots([
        ["2024-03-1", "yes"],
        ["2024-03-2", "yes"],
        ["2024-03-9", "no"],
      ]),
      servicePeriods: [
        { start: "2024-03-01T00:00:00", end: "2024-03-04T10:00:00" },
        { start: "2024-03-07T18:00:00", end: null },
      ],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({ eligibleVotes: 6, ballotsCast: 3, rate: 0.5 });
  });

  it("voto fora dos períodos do histórico entra na conta e é sinalizado", () => {
    // posse registrada às 15h30, mas votou na votação das 15h do mesmo dia
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(3),
      ballotsByVote: ballots([
        ["2024-03-1", "yes"],
        ["2024-03-2", "yes"],
      ]),
      servicePeriods: [{ start: "2024-03-01T15:30:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({
      eligibleVotes: 3,
      ballotsCast: 2,
      ballotsOutsideServicePeriods: 1,
    });
  });

  it("sem votações elegíveis a taxa é null, não zero", () => {
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(5),
      ballotsByVote: ballots([]),
      servicePeriods: [{ start: "2025-01-01T00:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({ eligibleVotes: 0, ballotsCast: 0, rate: null });
  });

  it("deputado sem nenhum período e sem votos não tem dado", () => {
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(5),
      ballotsByVote: ballots([]),
      servicePeriods: [],
      referenceDateTime: REF,
    });
    expect(result.rate).toBeNull();
  });

  it("ignora votações depois da data de referência", () => {
    const result = computeParticipation({
      deputyId: 1,
      votes: votes(10),
      ballotsByVote: ballots([["2024-03-1", "yes"]]),
      servicePeriods: FULL_TERM,
      referenceDateTime: "2024-03-02T23:59:59",
    });
    expect(result).toMatchObject({ eligibleVotes: 2, ballotsCast: 1, rate: 0.5 });
  });
});

describe("isWithinServicePeriods", () => {
  const periods = [{ start: "2024-03-01T10:00:00", end: "2024-03-05T10:00:00" }];

  it("início incluído, fim excluído", () => {
    expect(isWithinServicePeriods("2024-03-01T10:00:00", periods, REF)).toBe(true);
    expect(isWithinServicePeriods("2024-03-05T10:00:00", periods, REF)).toBe(false);
    expect(isWithinServicePeriods("2024-03-01T09:59:59", periods, REF)).toBe(false);
  });

  it("período aberto vai até a data de referência", () => {
    const open = [{ start: "2024-03-01T10:00:00", end: null }];
    expect(isWithinServicePeriods("2024-03-10T10:00:00", open, "2024-03-20T00:00:00")).toBe(true);
    expect(isWithinServicePeriods("2024-03-25T10:00:00", open, "2024-03-20T00:00:00")).toBe(false);
  });
});

describe("computeParticipationForAll", () => {
  it("separa os votos de cada deputado", () => {
    const all = votes(2);
    const results = computeParticipationForAll({
      deputies: [
        { deputyId: 1, servicePeriods: FULL_TERM },
        { deputyId: 2, servicePeriods: FULL_TERM },
        { deputyId: 3, servicePeriods: FULL_TERM },
      ],
      votes: all,
      ballots: [
        { voteId: "2024-03-1", deputyId: 1, value: "yes" },
        { voteId: "2024-03-2", deputyId: 1, value: "no" },
        { voteId: "2024-03-1", deputyId: 2, value: "obstruction" },
      ],
      referenceDateTime: REF,
    });
    expect(results.map((r) => [r.deputyId, r.ballotsCast, r.rate])).toEqual([
      [1, 2, 1],
      [2, 1, 0.5],
      [3, 0, 0],
    ]);
  });
});
