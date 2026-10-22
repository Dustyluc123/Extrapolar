// Monta os períodos em que um deputado esteve em exercício a partir do histórico oficial.
// Regras (ADR 0007):
// - só eventos da legislatura pedida e até a data de referência;
// - "Exercício" abre um período; qualquer outra situação fecha; situação vazia é ignorada;
// - situações comparadas sem acento e sem diferença de maiúsculas;
// - empate de horário: eventos que fecham vêm antes dos que abrem.
import { foldText, type CamaraHistoryEvent, type ServicePeriod } from "@extrapolar/shared";
import { withSeconds } from "../lib/time";

const IN_SERVICE = foldText("Exercício");

export function isInServiceSituation(situation: string): boolean {
  return foldText(situation) === IN_SERVICE;
}

export function buildServicePeriods(
  events: readonly CamaraHistoryEvent[],
  legislatureId: number,
  referenceDateTime: string,
): ServicePeriod[] {
  const relevant = events
    .filter((event) => event.idLegislatura === legislatureId && event.situacao !== null)
    .map((event) => ({
      at: withSeconds(event.dataHora),
      opens: isInServiceSituation(event.situacao as string),
    }))
    .filter((event) => event.at <= referenceDateTime)
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
