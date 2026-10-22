// Etapa 2: converte o formato da Câmara para os tipos internos.
import type { CamaraOrientation, Deputy, ServicePeriod } from "@extrapolar/shared";
import { indexOrientations } from "../normalize/orientations";
import { buildOrganMemberships, type DeputyOrgans } from "../normalize/committees";
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
  /** Cargos em órgãos por deputado. */
  organsByDeputy: Map<number, DeputyOrgans>;
  committeeMeetings: FetchedSources["committeeMeetings"];
  eventRequests: FetchedSources["eventRequests"];
  requestedEventInfo: FetchedSources["requestedEventInfo"];
  authorship: FetchedSources["authorship"];
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
  const organsByDeputy = buildOrganMemberships({
    members: fetched.organMembers,
    organs: fetched.organs,
    deputyIds: new Set(deputies.map((d) => d.id)),
    referenceDate: context.referenceDateTime.slice(0, 10),
    quality: context.quality,
  });
  log.info(
    `${fetched.committeeMeetings.length} reuniões de comissão; ${fetched.eventRequests.size} eventos com requerimento; ${fetched.authorship.size} proposições com autoria de deputado`,
  );
  return {
    organsByDeputy,
    committeeMeetings: fetched.committeeMeetings,
    eventRequests: fetched.eventRequests,
    requestedEventInfo: fetched.requestedEventInfo,
    authorship: fetched.authorship,
    deputies,
    servicePeriods,
    plenary: fetched.plenary,
    orientationsByVote,
    sessions: fetched.sessions,
    federations: fetched.federations,
  };
}
