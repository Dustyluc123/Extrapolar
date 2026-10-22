// Participação em votações nominais de plenário (docs/METODOLOGIA.md, ADR 0007).
// Função pura: recebe tudo pronto (votações já filtradas, votos e períodos) e só conta.
import type {
  BallotBreakdown,
  MetricValue,
  Participation,
  ServicePeriod,
} from "@extrapolar/shared";
import { safeRatio } from "./ratio";
import { ratioValue } from "./value";

export type BallotValue = keyof BallotBreakdown;

/** Votação nominal de plenário, com data e hora local (AAAA-MM-DDTHH:mm:ss). */
export interface NominalVote {
  id: string;
  dateTime: string;
}

export interface Ballot {
  voteId: string;
  deputyId: number;
  value: BallotValue;
}

export interface DeputyServiceRecord {
  deputyId: number;
  servicePeriods: readonly ServicePeriod[];
}

export function emptyBreakdown(): BallotBreakdown {
  return { yes: 0, no: 0, abstention: 0, obstruction: 0, article17: 0, secret: 0 };
}

/** true se `dateTime` está dentro de algum período (início incluído, fim excluído). */
export function isWithinServicePeriods(
  dateTime: string,
  periods: readonly ServicePeriod[],
  referenceDateTime: string,
): boolean {
  return periods.some(
    (period) => period.start <= dateTime && dateTime < (period.end ?? referenceDateTime),
  );
}

/**
 * Calcula a participação de um deputado.
 * - Elegível: votação dentro de um período em exercício, ou em que ele votou mesmo fora do período.
 * - Participou: qualquer voto registrado (Sim, Não, Abstenção, Obstrução, Artigo 17, secreto).
 * - Votações depois da data de referência são ignoradas.
 */
export function computeParticipation(input: {
  deputyId: number;
  votes: readonly NominalVote[];
  /** Votos do deputado, por id da votação. */
  ballotsByVote: ReadonlyMap<string, BallotValue>;
  servicePeriods: readonly ServicePeriod[];
  referenceDateTime: string;
}): Participation {
  const { deputyId, votes, ballotsByVote, servicePeriods, referenceDateTime } = input;
  const breakdown = emptyBreakdown();
  let eligibleVotes = 0;
  let ballotsCast = 0;
  let ballotsOutsideServicePeriods = 0;

  for (const vote of votes) {
    // Fim inclusivo aqui: uma votação exatamente no instante de referência ainda conta.
    if (vote.dateTime > referenceDateTime) continue;
    const ballot = ballotsByVote.get(vote.id);
    const inService = isWithinServicePeriods(vote.dateTime, servicePeriods, referenceDateTime);
    if (!inService && ballot === undefined) continue;

    eligibleVotes++;
    if (ballot === undefined) continue;
    ballotsCast++;
    breakdown[ballot]++;
    if (!inService) ballotsOutsideServicePeriods++;
  }

  return {
    deputyId,
    eligibleVotes,
    ballotsCast,
    rate: safeRatio(ballotsCast, eligibleVotes),
    breakdown,
    ballotsOutsideServicePeriods,
    servicePeriods: [...servicePeriods],
  };
}

/** Calcula a participação de vários deputados de uma vez, indexando os votos por deputado. */
export function computeParticipationForAll(input: {
  deputies: readonly DeputyServiceRecord[];
  votes: readonly NominalVote[];
  ballots: readonly Ballot[];
  referenceDateTime: string;
}): Participation[] {
  const byDeputy = new Map<number, Map<string, BallotValue>>();
  for (const ballot of input.ballots) {
    let map = byDeputy.get(ballot.deputyId);
    if (!map) byDeputy.set(ballot.deputyId, (map = new Map()));
    map.set(ballot.voteId, ballot.value);
  }
  const noBallots = new Map<string, BallotValue>();
  return input.deputies.map((deputy) =>
    computeParticipation({
      deputyId: deputy.deputyId,
      votes: input.votes,
      ballotsByVote: byDeputy.get(deputy.deputyId) ?? noBallots,
      servicePeriods: deputy.servicePeriods,
      referenceDateTime: input.referenceDateTime,
    }),
  );
}

/** Valor padronizado da participação (para metricas.json e o resumo em números). */
export function participationValue(participation: Participation): MetricValue {
  return ratioValue(participation.ballotsCast, participation.eligibleVotes, "sem-votacao-elegivel");
}
