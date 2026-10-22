// Monta os períodos em que um deputado esteve em exercício a partir do histórico oficial.
// Regras (ADR 0007):
// - só eventos da legislatura pedida, datados a partir do início dela e até a data de referência
//   (o histórico às vezes marca com a legislatura nova um evento antigo, como uma troca de partido
//   de 2022 marcada como 57ª legislatura);
// - "Exercício" abre um período; qualquer outra situação fecha; situação vazia é ignorada;
// - situações comparadas sem acento e sem diferença de maiúsculas;
// - empate de horário: eventos que fecham vêm antes dos que abrem.
import {
  foldText,
  legislatureStartDateTime,
  type CamaraHistoryEvent,
  type Legislature,
  type ServicePeriod,
} from "@extrapolar/shared";
import { withSeconds } from "../lib/time";

const IN_SERVICE = foldText("Exercício");

export function isInServiceSituation(situation: string): boolean {
  return foldText(situation) === IN_SERVICE;
}

/** Eventos marcados com a legislatura, mas datados antes do início dela (ignorados). */
export function countEventsBeforeLegislature(
  events: readonly CamaraHistoryEvent[],
  legislature: Legislature,
): number {
  const start = legislatureStartDateTime(legislature);
  return events.filter(
    (event) => event.idLegislatura === legislature.id && withSeconds(event.dataHora) < start,
  ).length;
}

export function buildServicePeriods(
  events: readonly CamaraHistoryEvent[],
  legislature: Legislature,
  referenceDateTime: string,
): ServicePeriod[] {
  const start = legislatureStartDateTime(legislature);
  const relevant = events
    .filter((event) => event.idLegislatura === legislature.id && event.situacao !== null)
    .map((event) => ({
      at: withSeconds(event.dataHora),
      opens: isInServiceSituation(event.situacao as string),
    }))
    .filter((event) => event.at >= start && event.at <= referenceDateTime)
    .sort((a, b) => a.at.localeCompare(b.at) || Number(a.opens) - Number(b.opens));

  const periods: ServicePeriod[] = [];
  let openSince: string | null = null;
  for (const event of relevant) {
    if (event.opens) {
      openSince ??= event.at;
    } else if (openSince !== null) {
      periods.push({ start: openSince, end: event.at });
      openSince = null;
    }
  }
  if (openSince !== null) periods.push({ start: openSince, end: null });
  return periods;
}
