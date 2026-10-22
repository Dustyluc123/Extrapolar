// Etapa 3: calcula as métricas com as funções puras de @extrapolar/metrics e monta
// o detalhe de cada deputado (por caderno) e o índice de métricas para a Fase 2.
import {
  GENERATED_SCHEMA_VERSION,
  type DeputyDetail,
  type MetricIndexEntry,
  type MetricsIndex,
  type MetricValue,
} from "@extrapolar/shared";
import { computeParticipationForAll, participationValue } from "@extrapolar/metrics";
import { log } from "../lib/log";
import type { PipelineContext } from "./context";
import type { NormalizedData } from "./normalize";

export interface ComputedData {
  details: DeputyDetail[];
  metricsIndex: MetricsIndex;
  totals: { nominalPlenaryVotes: number; lastNominalVoteDate: string | null };
}

/** Descrição de uma métrica no índice; `pick` tira o valor do detalhe de cada deputado. */
interface MetricDefinition {
  key: string;
  caderno: string;
  label: string;
  unit: MetricIndexEntry["unit"];
  methodologyAnchor: string;
  pick: (detail: DeputyDetail) => MetricValue;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "participacao",
    caderno: "plenario",
    label: "Participação em votações nominais de plenário",
    unit: "proporcao",
    methodologyAnchor: "participacao",
    pick: (detail) => participationValue(detail.plenario.participacao),
  },
];

export function compute(context: PipelineContext, data: NormalizedData): ComputedData {
  log.step("Calculando participação em votações nominais de plenário");
  const participation = computeParticipationForAll({
    deputies: data.deputies.map((deputy) => ({
      deputyId: deputy.id,
      servicePeriods: data.servicePeriods.get(deputy.id) ?? [],
    })),
    votes: data.plenary.votes,
    ballots: data.plenary.ballots,
    referenceDateTime: context.referenceDateTime,
  });

  const outside = participation.reduce((sum, p) => sum + p.ballotsOutsideServicePeriods, 0);
  if (outside > 0) {
    context.quality.add(
      "voto-fora-do-periodo",
      "Votos registrados em votações fora dos períodos em exercício do histórico (contados mesmo assim).",
      outside,
    );
  }

  const details: DeputyDetail[] = participation.map((entry) => ({
    schemaVersion: GENERATED_SCHEMA_VERSION,
    deputyId: entry.deputyId,
    plenario: { participacao: entry },
  }));

  const lastVote = data.plenary.votes.at(-1);
  return {
    details,
    metricsIndex: buildMetricsIndex(context.legislature.id, details),
    totals: {
      nominalPlenaryVotes: data.plenary.votes.length,
      lastNominalVoteDate: lastVote ? lastVote.dateTime.slice(0, 10) : null,
    },
  };
}

export function buildMetricsIndex(legislatureId: number, details: DeputyDetail[]): MetricsIndex {
  return {
    schemaVersion: GENERATED_SCHEMA_VERSION,
    legislatureId,
    metrics: METRIC_DEFINITIONS.map(({ pick, ...definition }) => ({
      ...definition,
      values: Object.fromEntries(details.map((detail) => [String(detail.deputyId), pick(detail)])),
    })),
  };
}
