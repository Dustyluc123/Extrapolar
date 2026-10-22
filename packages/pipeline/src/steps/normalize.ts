// Etapa 2: converte o formato da Câmara para os tipos internos.
import type { CamaraOrientation, Deputy, ServicePeriod } from "@extrapolar/shared";
import { indexOrientations } from "../normalize/orientations";
import type { PlenarySessionsSelection } from "../normalize/sessions";
import type { Federation } from "../sources/camara-api";
import type { PlenaryVotesSelection } from "../normalize/votes";
import { buildServicePeriods } from "../normalize/service-periods";
import { log } from "../lib/log";
import { normalizeDeputies } from "../normalize/deputies";
import type { PipelineContext } from "./context";
import type { FetchedSources } from "./fetch";

export interface NormalizedData {
  deputies: Deputy[];
  servicePeriods: Map<number, ServicePeriod[]>;
  plenary: PlenaryVotesSelection;
  /** Orientações por votação (só votações nominais de plenário selecionadas). */
  orientationsByVote: Map<string, CamaraOrientation[]>;
  sessions: PlenarySessionsSelection;
  federations: Federation[];
}

export function normalize(context: PipelineContext, fetched: FetchedSources): NormalizedData {
  log.step("Normalizando dados");
  const deputies = normalizeDeputies(
    fetched.deputies,
    context.legislature,
    context.referenceDateTime,
    context.quality,
  );
  const servicePeriods = new Map(
    fetched.deputies.map(({ item, history }) => [
      item.id,
      buildServicePeriods(history, context.legislature, context.referenceDateTime),
    ]),
  );
  log.info(`${deputies.length} deputados normalizados`);
  log.info(
    `${fetched.plenary.votes.length} votações nominais de plenário, ${fetched.plenary.ballots.length} votos individuais`,
  );
  const voteIds = new Set(fetched.plenary.votes.map((vote) => vote.id));
  const orientationsByVote = indexOrientations(fetched.orientations, voteIds);
  log.info(
    `${fetched.sessions.sessions.length} sessões deliberativas; orientações em ${orientationsByVote.size} votações`,
  );
  return {
    deputies,
    servicePeriods,
    plenary: fetched.plenary,
    orientationsByVote,
    sessions: fetched.sessions,
    federations: fetched.federations,
  };
}
