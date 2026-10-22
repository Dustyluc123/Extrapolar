// Etapa 3: calcula as métricas com as funções puras de @extrapolar/metrics.
import type { ParticipationFile } from "@extrapolar/shared";
import { GENERATED_SCHEMA_VERSION } from "@extrapolar/shared";
import { computeParticipationForAll } from "@extrapolar/metrics";
import { log } from "../lib/log";
import type { PipelineContext } from "./context";
import type { NormalizedData } from "./normalize";

export interface ComputedMetrics {
  participation: ParticipationFile;
}

export function compute(context: PipelineContext, data: NormalizedData): ComputedMetrics {
  log.step("Calculando participação em votações nominais de plenário");
  const deputies = computeParticipationForAll({
    deputies: data.deputies.map((deputy) => ({
      deputyId: deputy.id,
      servicePeriods: data.servicePeriods.get(deputy.id) ?? [],
    })),
    votes: data.plenary.votes,
    ballots: data.plenary.ballots,
    referenceDateTime: context.referenceDateTime,
  });

  const outside = deputies.reduce((sum, p) => sum + p.ballotsOutsideServicePeriods, 0);
  if (outside > 0) {
    context.quality.add(
      "voto-fora-do-periodo",
      "Votos registrados em votações fora dos períodos em exercício do histórico (contados mesmo assim).",
      outside,
    );
  }
  const withoutData = deputies.filter((p) => p.rate === null).length;
  log.info(`${deputies.length} deputados calculados; ${withoutData} sem votação elegível`);

  const lastVote = data.plenary.votes.at(-1);
  return {
    participation: {
      schemaVersion: GENERATED_SCHEMA_VERSION,
      legislatureId: context.legislature.id,
      referenceDateTime: context.referenceDateTime,
      nominalPlenaryVotes: data.plenary.votes.length,
      lastVoteDate: lastVote ? lastVote.dateTime.slice(0, 10) : null,
      deputies,
    },
  };
}
