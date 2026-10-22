// Etapa 3: calcula as métricas com as funções puras de @extrapolar/metrics.
// A primeira métrica (participação) entra na Etapa 5 da Fase 0.
import type { PipelineContext } from "./context";
import type { NormalizedData } from "./normalize";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComputedMetrics {}

export function compute(_context: PipelineContext, _data: NormalizedData): ComputedMetrics {
  return {};
}
