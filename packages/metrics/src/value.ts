// Construtores do valor padronizado de métrica (ok ou sem dado com motivo).
import type { MetricValue, NoDataReason } from "@extrapolar/shared";

export function okValue(
  value: number,
  numerator: number | null = null,
  denominator: number | null = null,
): MetricValue {
  return { status: "ok", value, numerator, denominator };
}

export function noData(reason: NoDataReason): MetricValue {
  return { status: "sem-dado", reason };
}

/** Razão como MetricValue: sem denominador vira "sem dado" com o motivo dado, nunca 0. */
export function ratioValue(
  numerator: number,
  denominator: number,
  reason: NoDataReason,
): MetricValue {
  if (denominator <= 0) return noData(reason);
  return okValue(numerator / denominator, numerator, denominator);
}
