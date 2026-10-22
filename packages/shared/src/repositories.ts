// Interface de acesso aos dados usada pelo site.
// Hoje: JsonDeputyRepository (apps/web/src/lib/data.ts) lê data/generated.
// Futuro: uma implementação com PostgreSQL, sem mudar as páginas (ADR 0002).
import type { DatasetMeta, Deputy, Participation, ParticipationFile } from "./schemas/generated";

export interface DeputyProfile {
  deputy: Deputy;
  /** null quando o deputado não aparece no arquivo de participação. */
  participation: Participation | null;
}

export interface DeputyRepository {
  /** Deputados em exercício, em ordem alfabética de nome. */
  listDeputies(): Promise<Deputy[]>;
  getDeputy(id: number): Promise<DeputyProfile | null>;
  getMeta(): Promise<DatasetMeta>;
  getParticipationSummary(): Promise<Omit<ParticipationFile, "deputies">>;
}
