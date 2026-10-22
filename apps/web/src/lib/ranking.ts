// Dados compactos do "Monte seu ranking", montados no build a partir de metricas.json (ADR 0010,
// atualizado na Fase 2). Vão como arquivo estático (/ranking/dados.json), baixado pela ilha.
import { NO_DATA_REASONS, type NoDataReason } from "@extrapolar/shared";
import { repository } from "./data";
import { RANKING_METRIC_TEXT } from "./ranking-metrics";

/** Abaixo disso, porcentagem tem aviso de base pequena (o mesmo de todo o site). */
export const SMALL_BASE = 30;

export const CADERNO_LABELS: Record<string, string> = {
  plenario: "Plenário",
  comissoes: "Comissões",
  projetos: "Projetos e leis",
  fiscalizacao: "Fiscalização",
  voz: "Voz",
  dinheiro: "Dinheiro público",
  articulacao: "Articulação",
};

export interface RankingMetric {
  key: string;
  label: string;
  unit: "proporcao" | "contagem" | "reais";
  caderno: string;
  anchor: string;
  whatIs: string;
}

export interface RankingData {
  metrics: RankingMetric[];
  deputies: { id: number; name: string; party: string; state: string }[];
  /** Por métrica, um valor por deputado (ordem de `deputies`); null = sem dado. */
  values: Record<string, (number | null)[]>;
  /** Por métrica, o código do motivo de "sem dado" (ou null). */
  reasons: Record<string, (string | null)[]>;
  /** Por métrica, "1" quando a porcentagem tem base pequena (< 30). */
  small: Record<string, string>;
  reasonTexts: Record<string, string>;
}

const round = (value: number, unit: RankingMetric["unit"]) =>
  unit === "proporcao" ? Math.round(value * 1e5) / 1e5 : Math.round(value * 100) / 100;

export async function buildRankingData(): Promise<RankingData> {
  const index = await repository.getMetricsIndex();
  const deputies = (await repository.listDeputies()).map((d) => ({
    id: d.id,
    name: d.name,
    party: d.party,
    state: d.state,
  }));
  const metrics: RankingMetric[] = [];
  const values: RankingData["values"] = {};
  const reasons: RankingData["reasons"] = {};
  const small: RankingData["small"] = {};
  for (const metric of index.metrics) {
    const whatIs = RANKING_METRIC_TEXT[metric.key];
    if (!whatIs) throw new Error(`Falta o "O que é isso?" da métrica ${metric.key} no ranking.`);
    metrics.push({
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      caderno: metric.caderno,
      anchor: metric.methodologyAnchor,
      whatIs,
    });
    values[metric.key] = deputies.map((d) => {
      const v = metric.values[String(d.id)];
      return v?.status === "ok" ? round(v.value, metric.unit) : null;
    });
    reasons[metric.key] = deputies.map((d) => {
      const v = metric.values[String(d.id)];
      return v?.status === "sem-dado" ? v.reason : v ? null : "fonte-indisponivel";
    });
    small[metric.key] = deputies
      .map((d) => {
        const v = metric.values[String(d.id)];
        return metric.unit === "proporcao" &&
          v?.status === "ok" &&
          v.denominator !== null &&
          v.denominator < SMALL_BASE
          ? "1"
          : "0";
      })
      .join("");
  }
  const reasonTexts = Object.fromEntries(
    Object.entries(NO_DATA_REASONS).map(([code, text]) => [code as NoDataReason, text]),
  );
  return { metrics, deputies, values, reasons, small, reasonTexts };
}
