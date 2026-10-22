// Contexto compartilhado pelas etapas do pipeline.
import type { Legislature } from "@extrapolar/shared";
import type { CachedFetchContext } from "../lib/cached-fetch";
import type { QualityLog } from "../normalize/quality";

export interface PipelineContext {
  legislature: Legislature;
  /** Até quando os dados valem, em horário de Brasília (AAAA-MM-DDTHH:mm:ss). */
  referenceDateTime: string;
  /** Momento da geração (ISO, UTC). */
  generatedAt: string;
  fetch: CachedFetchContext;
  quality: QualityLog;
}
