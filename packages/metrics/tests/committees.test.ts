import { describe, expect, it } from "vitest";
import {
  countMembershipsOn,
  eligibleCommitteeMeetings,
  isMemberOn,
  summarizeRequestedEvents,
  type CommitteeMeeting,
  type MembershipInterval,
} from "../src/index";

const intervals: MembershipInterval[] = [
  { organId: 1, start: "2023-03-15", end: "2024-02-04" },
  { organId: 1, start: "2024-03-06", end: null },
  { organId: 2, start: "2025-01-01", end: "2025-06-30" },
];

describe("isMemberOn", () => {
  it("considera início e fim inclusivos e o intervalo aberto", () => {
    expect(isMemberOn("2023-03-15T10:00:00", 1, intervals)).toBe(true);
    expect(isMemberOn("2024-02-04T23:00:00", 1, intervals)).toBe(true);
    expect(isMemberOn("2024-02-20T10:00:00", 1, intervals)).toBe(false); // intervalo entre mandatos
    expect(isMemberOn("2026-10-01T10:00:00", 1, intervals)).toBe(true);
    expect(isMemberOn("2025-07-01T10:00:00", 2, intervals)).toBe(false);
  });
});

describe("eligibleCommitteeMeetings", () => {
  const meetings: CommitteeMeeting[] = [
    { id: 10, dateTime: "2023-04-01T10:00:00", organIds: [1] },
    { id: 11, dateTime: "2024-02-20T10:00:00", organIds: [1] },
    { id: 12, dateTime: "2025-03-01T10:00:00", organIds: [3, 2] }, // reunião conjunta
    { id: 13, dateTime: "2025-03-01T10:00:00", organIds: [3] },
  ];

  it("só reuniões de órgãos em que era titular na data", () => {
    expect(eligibleCommitteeMeetings(meetings, intervals).map((m) => m.id)).toEqual([10, 12]);
  });

  it("sem titularidade, nenhuma reunião", () => {
    expect(eligibleCommitteeMeetings(meetings, [])).toEqual([]);
  });
});

describe("countMembershipsOn", () => {
  it("conta órgãos distintos na data", () => {
    expect(countMembershipsOn("2025-03-01", intervals)).toBe(2);
    expect(countMembershipsOn("2026-10-22T00:00:00", intervals)).toBe(1);
    expect(countMembershipsOn("2023-01-01", intervals)).toBe(0);
  });
});

describe("summarizeRequestedEvents", () => {
  it("conta cada evento uma vez, por tipo, e marca primeiro signatário", () => {
    const summary = summarizeRequestedEvents([
      { id: 1, type: "Audiência Pública", firstSigner: false },
      { id: 1, type: "Audiência Pública", firstSigner: true }, // dois requerimentos do mesmo evento
      { id: 2, type: "Audiência Pública", firstSigner: false },
      { id: 3, type: "Seminário", firstSigner: true },
    ]);
    expect(summary).toEqual({
      total: 3,
      asFirstSigner: 2,
      byType: [
        { type: "Audiência Pública", count: 2 },
        { type: "Seminário", count: 1 },
      ],
    });
  });
});
