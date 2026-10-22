// Comissões: funções puras sobre participação em órgãos, reuniões elegíveis e eventos a pedido.
// Regras em docs/METODOLOGIA.md#presenca-comissoes e #eventos-requeridos.
import type { DatedEvent } from "./attendance";

/** Período em que o deputado foi membro com direito a voto (titular, presidente ou vice). */
export interface MembershipInterval {
  organId: number;
  /** AAAA-MM-DD */
  start: string;
  /** AAAA-MM-DD (inclusive) ou null se ainda em andamento. */
  end: string | null;
}

export interface CommitteeMeeting extends DatedEvent {
  /** Órgãos que realizaram a reunião (reuniões conjuntas têm mais de um). */
  organIds: readonly number[];
}

export function isMemberOn(
  date: string,
  organId: number,
  intervals: readonly MembershipInterval[],
) {
  const day = date.slice(0, 10);
  return intervals.some(
    (i) => i.organId === organId && i.start <= day && (i.end === null || day <= i.end),
  );
}

/** Reuniões de órgãos em que o deputado era membro titular na data da reunião. */
export function eligibleCommitteeMeetings(
  meetings: readonly CommitteeMeeting[],
  intervals: readonly MembershipInterval[],
): DatedEvent[] {
  if (intervals.length === 0) return [];
  const organs = new Set(intervals.map((i) => i.organId));
  return meetings
    .filter((m) => m.organIds.some((id) => organs.has(id) && isMemberOn(m.dateTime, id, intervals)))
    .map(({ id, dateTime }) => ({ id, dateTime }));
}

/** Quantos órgãos distintos têm o deputado como titular na data (AAAA-MM-DD...). */
export function countMembershipsOn(date: string, intervals: readonly MembershipInterval[]): number {
  const day = date.slice(0, 10);
  const organs = new Set<number>();
  for (const i of intervals) {
    if (i.start <= day && (i.end === null || day <= i.end)) organs.add(i.organId);
  }
  return organs.size;
}

export interface RequestedEvent {
  id: number;
  type: string;
  /** Posições de autoria do deputado nos requerimentos ligados ao evento. */
  firstSigner: boolean;
}

export interface RequestedEventsSummary {
  total: number;
  asFirstSigner: number;
  byType: { type: string; count: number }[];
}

/** Resume eventos realizados a partir de requerimentos de autoria do deputado. */
export function summarizeRequestedEvents(
  events: readonly RequestedEvent[],
): RequestedEventsSummary {
  const unique = new Map<number, RequestedEvent>();
  for (const event of events) {
    const seen = unique.get(event.id);
    unique.set(
      event.id,
      seen ? { ...seen, firstSigner: seen.firstSigner || event.firstSigner } : event,
    );
  }
  const byType = new Map<string, number>();
  let asFirstSigner = 0;
  for (const event of unique.values()) {
    byType.set(event.type, (byType.get(event.type) ?? 0) + 1);
    if (event.firstSigner) asFirstSigner++;
  }
  return {
    total: unique.size,
    asFirstSigner,
    byType: [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };
}
