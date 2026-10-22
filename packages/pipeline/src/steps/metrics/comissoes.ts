// Caderno 2 — Comissões: cargos, presença nas reuniões em que é titular e eventos a pedido.
import type { Comissoes } from "@extrapolar/shared";
import {
  computeAttendance,
  countMembershipsOn,
  eligibleCommitteeMeetings,
  summarizeRequestedEvents,
  type RequestedEvent,
} from "@extrapolar/metrics";
import { isFirstSigner } from "../../normalize/committees";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

const RECENT_LIMIT = 5;
const DESCRIPTION_LIMIT = 220;

export function computeComissoes(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Comissoes> {
  const { referenceDateTime, legislature, quality } = context;
  const start = legislature.start;
  const today = referenceDateTime.slice(0, 10);

  // Eventos realizados a partir de requerimentos, por deputado autor (proponente).
  const requestedByDeputy = new Map<number, (RequestedEvent & { date: string })[]>();
  let unknownRequests = 0;
  for (const [eventId, propositionIds] of data.eventRequests) {
    const info = data.requestedEventInfo.get(eventId);
    if (!info || !info.finished || info.date < start || info.date > today) continue;
    for (const propositionId of propositionIds) {
      const authors = data.authorship.get(propositionId);
      if (!authors) {
        unknownRequests++;
        continue;
      }
      for (const author of authors) {
        if (!author.proponent) continue;
        const list = requestedByDeputy.get(author.deputyId) ?? [];
        list.push({
          id: eventId,
          type: info.type,
          firstSigner: isFirstSigner(author),
          date: info.date,
        });
        requestedByDeputy.set(author.deputyId, list);
      }
    }
  }
  if (unknownRequests > 0) {
    quality.add(
      "requerimento-sem-autoria",
      "Requerimento ligado a evento sem autoria nos arquivos de proposições da legislatura (ex.: apresentado antes de 2023).",
      unknownRequests,
    );
  }

  const result = new Map<number, Comissoes>();
  for (const deputy of data.deputies) {
    const organs = data.organsByDeputy.get(deputy.id) ?? { memberships: [], votingIntervals: [] };
    const eligible = eligibleCommitteeMeetings(data.committeeMeetings, organs.votingIntervals);
    const presencaReunioes = computeAttendance({
      events: eligible,
      attended: data.sessions.presencesByDeputy.get(deputy.id) ?? new Set(),
      servicePeriods: data.servicePeriods.get(deputy.id) ?? [],
      referenceDateTime,
    });

    const requested = requestedByDeputy.get(deputy.id) ?? [];
    const summary = summarizeRequestedEvents(requested);
    const recentIds = [...new Map(requested.map((r) => [r.id, r])).values()]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .slice(0, RECENT_LIMIT);

    result.set(deputy.id, {
      participacoes: organs.memberships,
      titularHoje: countMembershipsOn(today, organs.votingIntervals),
      foiTitular: organs.votingIntervals.length > 0,
      presencaReunioes,
      eventosRequeridos: {
        total: summary.total,
        comoPrimeiroSignatario: summary.asFirstSigner,
        porTipo: summary.byType.map((t) => ({ tipo: t.type, quantidade: t.count })),
        recentes: recentIds.map((r) => {
          const info = data.requestedEventInfo.get(r.id);
          const description = (info?.description ?? "").replace(/\s+/g, " ").trim();
          return {
            data: r.date,
            tipo: r.type,
            orgaos: info?.organs ?? [],
            descricao:
              description.length > DESCRIPTION_LIMIT
                ? `${description.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…`
                : description,
          };
        }),
      },
    });
  }
  return result;
}
