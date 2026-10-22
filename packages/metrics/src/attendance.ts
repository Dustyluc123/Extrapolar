// Presença em eventos (sessões do plenário, reuniões de comissão): função pura e genérica.
// Mesma regra da participação (ADR 0007): conta só eventos durante os períodos em exercício;
// presença registrada fora do período também conta (se estava presente, estava em exercício).
import type { ServicePeriod } from "@extrapolar/shared";
import { isWithinServicePeriods } from "./participation";
import { safeRatio } from "./ratio";

export interface DatedEvent {
  id: number;
  /** AAAA-MM-DDTHH:mm:ss (horário de Brasília). */
  dateTime: string;
}

export interface AttendanceResult {
  eligibleEvents: number;
  attendedEvents: number;
  rate: number | null;
  attendedOutsideServicePeriods: number;
}

export function computeAttendance(input: {
  events: readonly DatedEvent[];
  attended: ReadonlySet<number>;
  servicePeriods: readonly ServicePeriod[];
  referenceDateTime: string;
}): AttendanceResult {
  const { events, attended, servicePeriods, referenceDateTime } = input;
  let eligibleEvents = 0;
  let attendedEvents = 0;
  let attendedOutsideServicePeriods = 0;
  for (const event of events) {
    if (event.dateTime > referenceDateTime) continue;
    const present = attended.has(event.id);
    const inService = isWithinServicePeriods(event.dateTime, servicePeriods, referenceDateTime);
    if (!inService && !present) continue;
    eligibleEvents++;
    if (!present) continue;
    attendedEvents++;
    if (!inService) attendedOutsideServicePeriods++;
  }
  return {
    eligibleEvents,
    attendedEvents,
    rate: safeRatio(attendedEvents, eligibleEvents),
    attendedOutsideServicePeriods,
  };
}
