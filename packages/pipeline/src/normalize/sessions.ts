// Sessões deliberativas do plenário e presenças registradas (docs/METODOLOGIA.md#presenca-sessoes).
// Regra: órgão PLEN, tipo "Sessão Deliberativa", situação "Encerrada..." (exclui canceladas e
// futuras), dentro da legislatura e até a data de referência. Sessões solenes, comissões gerais e
// outros eventos ficam fora (não têm presença registrada).
import type { CamaraEvent, CamaraEventOrgan, CamaraEventPresence } from "@extrapolar/shared";
import type { DatedEvent } from "@extrapolar/metrics";

export const PLENARY_SESSION_TYPE = "Sessão Deliberativa";

export function isFinishedEvent(event: CamaraEvent): boolean {
  return event.situacao.startsWith("Encerrada");
}

export interface PlenarySessionsSelection {
  sessions: DatedEvent[];
  /** Presenças por deputado (ids das sessões). */
  presencesByDeputy: Map<number, Set<number>>;
}

export function selectPlenarySessions(input: {
  events: readonly CamaraEvent[];
  eventOrgans: readonly CamaraEventOrgan[];
  presences: readonly CamaraEventPresence[];
  start: string;
  end: string;
  referenceDateTime: string;
}): PlenarySessionsSelection {
  const limit = input.end < input.referenceDateTime ? input.end : input.referenceDateTime;
  const plenaryEventIds = new Set(
    input.eventOrgans.filter((o) => o.siglaOrgao === "PLEN").map((o) => o.idEvento),
  );
  const sessions: DatedEvent[] = [];
  for (const event of input.events) {
    if (!plenaryEventIds.has(event.id)) continue;
    if (event.descricaoTipo !== PLENARY_SESSION_TYPE || !isFinishedEvent(event)) continue;
    if (event.dataHoraInicio < input.start || event.dataHoraInicio > limit) continue;
    sessions.push({ id: event.id, dateTime: event.dataHoraInicio });
  }
  const sessionIds = new Set(sessions.map((s) => s.id));
  const presencesByDeputy = new Map<number, Set<number>>();
  for (const presence of input.presences) {
    if (!sessionIds.has(presence.idEvento)) continue;
    let set = presencesByDeputy.get(presence.idDeputado);
    if (!set) presencesByDeputy.set(presence.idDeputado, (set = new Set()));
    set.add(presence.idEvento);
  }
  sessions.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id - b.id);
  return { sessions, presencesByDeputy };
}
