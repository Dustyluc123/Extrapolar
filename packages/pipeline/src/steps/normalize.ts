// Etapa 2: converte o formato da Câmara para os tipos internos.
import type { Deputy } from "@extrapolar/shared";
import { log } from "../lib/log";
import { normalizeDeputies } from "../normalize/deputies";
import type { PipelineContext } from "./context";
import type { FetchedSources } from "./fetch";

export interface NormalizedData {
  deputies: Deputy[];
}

export function normalize(context: PipelineContext, fetched: FetchedSources): NormalizedData {
  log.step("Normalizando dados");
  const deputies = normalizeDeputies(
    fetched.deputies,
    context.legislature.id,
    context.referenceDateTime,
    context.quality,
  );
  log.info(`${deputies.length} deputados normalizados`);
  return { deputies };
}
