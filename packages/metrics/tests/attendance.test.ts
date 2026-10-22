import { describe, expect, it } from "vitest";
import { computeAttendance, type DatedEvent } from "../src/index";

const REF = "2026-10-22T00:00:00";

function sessions(count: number): DatedEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    dateTime: `2024-03-${String(i + 1).padStart(2, "0")}T14:00:00`,
  }));
}

describe("computeAttendance", () => {
  it("presença em todas as sessões é 100%", () => {
    const events = sessions(4);
    const result = computeAttendance({
      events,
      attended: new Set(events.map((e) => e.id)),
      servicePeriods: [{ start: "2023-02-01T00:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toEqual({
      eligibleEvents: 4,
      attendedEvents: 4,
      rate: 1,
      attendedOutsideServicePeriods: 0,
    });
  });

  it("só conta sessões do período em exercício", () => {
    const result = computeAttendance({
      events: sessions(10),
      attended: new Set([6, 7]),
      servicePeriods: [{ start: "2024-03-06T00:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({ eligibleEvents: 5, attendedEvents: 2, rate: 0.4 });
  });

  it("presença fora do período conta e é sinalizada", () => {
    const result = computeAttendance({
      events: sessions(3),
      attended: new Set([1]),
      servicePeriods: [{ start: "2024-03-01T15:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result).toMatchObject({
      eligibleEvents: 3,
      attendedEvents: 1,
      attendedOutsideServicePeriods: 1,
    });
  });

  it("sem sessão elegível a taxa é null, não zero", () => {
    const result = computeAttendance({
      events: sessions(3),
      attended: new Set(),
      servicePeriods: [{ start: "2025-01-01T00:00:00", end: null }],
      referenceDateTime: REF,
    });
    expect(result.rate).toBeNull();
  });

  it("ignora eventos depois da data de referência", () => {
    const result = computeAttendance({
      events: sessions(10),
      attended: new Set([1, 9]),
      servicePeriods: [{ start: "2023-02-01T00:00:00", end: null }],
      referenceDateTime: "2024-03-02T23:59:59",
    });
    expect(result).toMatchObject({ eligibleEvents: 2, attendedEvents: 1 });
  });
});
