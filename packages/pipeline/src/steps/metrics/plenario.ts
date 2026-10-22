// Caderno 1 — Plenário: participação, presença em sessões e alinhamentos.
import type { DeputyDetail } from "@extrapolar/shared";
import {
  computeAlignment,
  computeAttendance,
  computeParticipationForAll,
  type AlignmentEntry,
  type Ballot,
} from "@extrapolar/metrics";
import {
  resolveGovernmentOrientation,
  resolvePartyOrientation,
} from "../../normalize/orientations";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

export type Plenario = DeputyDetail["plenario"];

export function computePlenario(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Plenario> {
  const { referenceDateTime, quality } = context;

  const participation = computeParticipationForAll({
    deputies: data.deputies.map((deputy) => ({
      deputyId: deputy.id,
      servicePeriods: data.servicePeriods.get(deputy.id) ?? [],
    })),
    votes: data.plenary.votes,
    ballots: data.plenary.ballots,
    referenceDateTime,
  });
  const outsideVotes = participation.reduce((sum, p) => sum + p.ballotsOutsideServicePeriods, 0);
  if (outsideVotes > 0) {
    quality.add(
      "voto-fora-do-periodo",
      "Votos registrados em votações fora dos períodos em exercício do histórico (contados mesmo assim).",
      outsideVotes,
    );
  }

  // Votos de cada deputado, para os alinhamentos (só votações dentro da data de referência).
  const voteDates = new Map(data.plenary.votes.map((vote) => [vote.id, vote.dateTime]));
  const ballotsByDeputy = new Map<number, Ballot[]>();
  for (const ballot of data.plenary.ballots) {
    const date = voteDates.get(ballot.voteId);
    if (!date || date > referenceDateTime) continue;
    let list = ballotsByDeputy.get(ballot.deputyId);
    if (!list) ballotsByDeputy.set(ballot.deputyId, (list = []));
    list.push(ballot);
  }

  const result = new Map<number, Plenario>();
  let presenceOutside = 0;
  for (const entry of participation) {
    const periods = data.servicePeriods.get(entry.deputyId) ?? [];
    const presencaSessoes = computeAttendance({
      events: data.sessions.sessions,
      attended: data.sessions.presencesByDeputy.get(entry.deputyId) ?? new Set(),
      servicePeriods: periods,
      referenceDateTime,
    });
    presenceOutside += presencaSessoes.attendedOutsideServicePeriods;

    const ballots = ballotsByDeputy.get(entry.deputyId) ?? [];
    const partyEntries: AlignmentEntry[] = [];
    const governmentEntries: AlignmentEntry[] = [];
    let federationVotes = 0;
    for (const ballot of ballots) {
      const orientations = data.orientationsByVote.get(ballot.voteId);
      const party = resolvePartyOrientation(orientations, ballot.party ?? null, data.federations);
      partyEntries.push({ ballot: ballot.value, orientation: party.orientation });
      if (party.fromFederation && party.orientation.kind === "value") {
        if (["yes", "no", "abstention", "obstruction"].includes(ballot.value)) federationVotes++;
      }
      governmentEntries.push({
        ballot: ballot.value,
        orientation: resolveGovernmentOrientation(orientations),
      });
    }

    result.set(entry.deputyId, {
      participacao: entry,
      presencaSessoes,
      alinhamentoPartido: { ...computeAlignment(partyEntries), federationVotes },
      alinhamentoGoverno: { ...computeAlignment(governmentEntries), federationVotes: 0 },
    });
  }
  if (presenceOutside > 0) {
    quality.add(
      "presenca-fora-do-periodo",
      "Presenças em sessões fora dos períodos em exercício do histórico (contadas mesmo assim).",
      presenceOutside,
    );
  }
  return result;
}
