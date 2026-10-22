// Etapa 3: calcula as métricas com as funções puras de @extrapolar/metrics e monta
// o detalhe de cada deputado (por caderno) e o índice de métricas para a Fase 2.
import {
  GENERATED_SCHEMA_VERSION,
  type DeputyDetail,
  type MetricIndexEntry,
  type MetricsIndex,
  type MetricValue,
} from "@extrapolar/shared";
import { participationValue, ratioValue } from "@extrapolar/metrics";
import { log } from "../lib/log";
import type { PipelineContext } from "./context";
import { computePlenario } from "./metrics/plenario";
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
    pick: (d) => participationValue(d.plenario.participacao),
  },
  {
    key: "presenca-sessoes",
    caderno: "plenario",
    label: "Presença em sessões deliberativas do plenário",
    unit: "proporcao",
    methodologyAnchor: "presenca-sessoes",
    pick: (d) =>
      ratioValue(
        d.plenario.presencaSessoes.attendedEvents,
        d.plenario.presencaSessoes.eligibleEvents,
        "sem-sessao-elegivel",
      ),
  },
  {
    key: "alinhamento-partido",
    caderno: "plenario",
    label: "Alinhamento com a orientação do partido",
    unit: "proporcao",
    methodologyAnchor: "alinhamento-partido",
    pick: (d) =>
      ratioValue(
        d.plenario.alinhamentoPartido.alignedVotes,
        d.plenario.alinhamentoPartido.comparableVotes,
        "sem-orientacao-elegivel",
      ),
  },
  {
    key: "alinhamento-governo",
    caderno: "plenario",
    label: "Alinhamento com a orientação do Governo",
    unit: "proporcao",
    methodologyAnchor: "alinhamento-governo",
    pick: (d) =>
      ratioValue(
        d.plenario.alinhamentoGoverno.alignedVotes,
        d.plenario.alinhamentoGoverno.comparableVotes,
        "sem-orientacao-do-governo",
      ),
  },
];

export function compute(context: PipelineContext, data: NormalizedData): ComputedData {
  log.step("Calculando o Caderno 1 — Plenário");
  const plenario = computePlenario(context, data);

  const details: DeputyDetail[] = data.deputies.map((deputy) => {
    const p = plenario.get(deputy.id);
    if (!p) throw new Error(`Plenário não calculado para o deputado ${deputy.id}.`);
    return { schemaVersion: GENERATED_SCHEMA_VERSION, deputyId: deputy.id, plenario: p };
  });

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
