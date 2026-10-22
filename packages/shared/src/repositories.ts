// Interface de acesso aos dados usada pelo site.
// Hoje: JsonDeputyRepository (apps/web/src/lib/data.ts) lê data/generated.
// Futuro: uma implementação com PostgreSQL, sem mudar as páginas (ADR 0002).
import type {
  DatasetMeta,
  Deputy,
  DeputyDetail,
  FrontsIndex,
  MetricsIndex,
} from "./schemas/generated";

export interface DeputyProfile {
  deputy: Deputy;
  /** Métricas do deputado, por caderno. */
  detail: DeputyDetail;
}

export interface DeputyRepository {
  /** Deputados em exercício, em ordem alfabética de nome. */
  listDeputies(): Promise<Deputy[]>;
  getDeputy(id: number): Promise<DeputyProfile | null>;
  getMeta(): Promise<DatasetMeta>;
  /** Valores brutos de todas as métricas (para a Fase 2). */
  getMetricsIndex(): Promise<MetricsIndex>;
  /** Títulos das frentes parlamentares da legislatura. */
  getFronts(): Promise<FrontsIndex>;
}
