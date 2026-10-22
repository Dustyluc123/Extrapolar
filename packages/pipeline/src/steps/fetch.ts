// Etapa 1: baixa as fontes (com cache em data/raw) e valida o formato de cada uma.
// Arquivos grandes são reduzidos ano a ano logo depois de validados (ver fetchYears).
import {
  CAMARA_API_BASE,
  idFromUri,
  legislatureEndDateTime,
  legislatureStartDateTime,
  legislatureYears,
  type CamaraOrgan,
  type CamaraOrganMember,
  type CamaraOrientation,
  type SourceInfo,
} from "@extrapolar/shared";
import type { CommitteeMeeting } from "@extrapolar/metrics";
import { mapWithConcurrency } from "../lib/http";
import { log } from "../lib/log";
import {
  currentDeputiesSourceUrl,
  fetchCurrentDeputies,
  fetchDeputyHistory,
  fetchFederations,
  historySourceUrl,
  type Federation,
} from "../sources/camara-api";
import {
  STATIC_FILES,
  YEAR_FILES,
  fetchStaticFile,
  fetchYearFile,
} from "../sources/camara-arquivos";
import {
  COMMITTEE_TYPES,
  addAuthors,
  selectCommitteeMeetings,
  type Authorship,
} from "../normalize/committees";
import type { DeputyWithHistory } from "../normalize/deputies";
import { selectPlenarySessions, type PlenarySessionsSelection } from "../normalize/sessions";
import {
  PLENARY_ORGAN,
  selectNominalPlenaryVotes,
  type PlenaryVotesSelection,
} from "../normalize/votes";
import type { PipelineContext } from "./context";

export interface EventInfo {
  date: string;
  type: string;
  organs: string[];
  description: string;
  finished: boolean;
}

export interface FetchedSources {
  deputies: DeputyWithHistory[];
  /** Votações nominais de plenário e votos, já reduzidos ano a ano. */
  plenary: PlenaryVotesSelection;
  /** Orientações de bancada em votações de plenário (filtradas na normalização). */
  orientations: CamaraOrientation[];
  /**
   * Sessões deliberativas do plenário e presenças. `presencesByDeputy` também traz as presenças
   * nas reuniões de comissão selecionadas (ids de eventos não se repetem).
   */
  sessions: PlenarySessionsSelection;
  committeeMeetings: CommitteeMeeting[];
  federations: Federation[];
  organs: CamaraOrgan[];
  organMembers: CamaraOrganMember[];
  /** Requerimentos (ids de proposição) que originaram cada evento. */
  eventRequests: Map<number, number[]>;
  /** Dados dos eventos que têm requerimento. */
  requestedEventInfo: Map<number, EventInfo>;
  /** Autoria (só deputados) das proposições apresentadas na legislatura. */
  authorship: Map<number, Authorship[]>;
  sources: SourceInfo[];
}

export async function fetchSources(context: PipelineContext): Promise<FetchedSources> {
  log.step("Baixando deputados em exercício (API da Câmara)");
  const list = await fetchCurrentDeputies(context.fetch);
  log.info(`${list.length} deputados em exercício`);

  log.step("Baixando o histórico de cada deputado (API da Câmara)");
  let done = 0;
  const deputies = await mapWithConcurrency(list, 2, async (item) => {
    const history = await fetchDeputyHistory(context.fetch, item.id);
    done++;
    if (done % 100 === 0 || done === list.length) log.info(`${done}/${list.length} históricos`);
    return { item, history };
  });

  const sources: SourceInfo[] = [
    {
      id: "api-deputados",
      name: "API da Câmara — deputados em exercício",
      url: currentDeputiesSourceUrl,
      lastModified: null,
    },
    {
      id: "api-historico",
      name: "API da Câmara — histórico de cada deputado",
      url: historySourceUrl,
      lastModified: null,
    },
  ];

  log.step("Baixando federações partidárias (API da Câmara)");
  const federations = await fetchFederations(context.fetch, context.legislature.id);
  log.info(federations.map((f) => `${f.name}: ${f.parties.join(", ")}`).join(" · "));
  sources.push({
    id: "api-blocos",
    name: "API da Câmara — federações partidárias",
    url: `${CAMARA_API_BASE}/blocos?idLegislatura=${context.legislature.id}`,
    lastModified: null,
  });

  log.step("Baixando órgãos e participação dos deputados (arquivos estáticos)");
  const organs = await fetchStaticFile(context.fetch, STATIC_FILES.organs);
  const organMembers = await fetchStaticFile(
    context.fetch,
    STATIC_FILES.organMembers(context.legislature.id),
  );
  sources.push(organs.source, organMembers.source);
  const committeeOrganIds = new Set(
    organs.items.filter((o) => COMMITTEE_TYPES.has(o.tipoOrgao)).map((o) => idFromUri(o.uri)),
  );

  const years = await fetchYears(context, sources, committeeOrganIds);
  return {
    deputies,
    federations,
    organs: organs.items,
    organMembers: organMembers.items,
    sources,
    ...years,
  };
}

/**
 * Baixa, ano a ano, os arquivos da legislatura e, logo depois de validar, reduz cada ano ao que
 * interessa. Assim os arquivos brutos de todos os anos nunca ficam na memória ao mesmo tempo
 * (o de votos de um ano passa de 70 MB; o de autores, de 75 MB).
 */
async function fetchYears(
  context: PipelineContext,
  sources: SourceInfo[],
  committeeOrganIds: ReadonlySet<number>,
): Promise<
  Pick<
    FetchedSources,
    | "plenary"
    | "orientations"
    | "sessions"
    | "committeeMeetings"
    | "eventRequests"
    | "requestedEventInfo"
    | "authorship"
  >
> {
  log.step("Baixando arquivos anuais (arquivos estáticos da Câmara)");
  const { legislature, referenceDateTime, quality } = context;
  const start = legislatureStartDateTime(legislature);
  const end = legislatureEndDateTime(legislature);
  const selection: PlenaryVotesSelection = { votes: [], ballots: [] };
  const orientations: CamaraOrientation[] = [];
  const sessions: PlenarySessionsSelection = { sessions: [], presencesByDeputy: new Map() };
  const committeeMeetings: CommitteeMeeting[] = [];
  const eventRequests = new Map<number, number[]>();
  const requestedEventInfo = new Map<number, EventInfo>();
  const authorship = new Map<number, Authorship[]>();
  const seenVotes = new Set<string>();

  const addPresences = (byDeputy: Map<number, Set<number>>) => {
    for (const [deputyId, ids] of byDeputy) {
      const set = sessions.presencesByDeputy.get(deputyId) ?? new Set<number>();
      for (const id of ids) set.add(id);
      sessions.presencesByDeputy.set(deputyId, set);
    }
  };

  for (const year of legislatureYears(legislature, referenceDateTime)) {
    // Votações, votos e orientações
    const votesFile = await fetchYearFile(context.fetch, YEAR_FILES.votes, year);
    const ballotsFile = await fetchYearFile(context.fetch, YEAR_FILES.ballots, year);
    const orientationsFile = await fetchYearFile(context.fetch, YEAR_FILES.orientations, year);
    sources.push(votesFile.source, ballotsFile.source, orientationsFile.source);
    for (const orientation of orientationsFile.items) {
      if (orientation.siglaOrgao === PLENARY_ORGAN) orientations.push(orientation);
    }
    const yearSelection = selectNominalPlenaryVotes({
      votes: votesFile.items,
      ballots: ballotsFile.items,
      start,
      end,
      referenceDateTime,
      quality,
    });
    const newVotes = yearSelection.votes.filter((vote) => !seenVotes.has(vote.id));
    if (newVotes.length < yearSelection.votes.length) {
      quality.add(
        "votacao-em-dois-anos",
        "Votação presente em arquivos de dois anos; mantida uma.",
      );
    }
    const newIds = new Set(newVotes.map((vote) => vote.id));
    for (const id of newIds) seenVotes.add(id);
    // Laços em vez de push(...lista): listas com centenas de milhares de itens estouram a pilha.
    for (const vote of newVotes) selection.votes.push(vote);
    for (const ballot of yearSelection.ballots) {
      if (newIds.has(ballot.voteId)) selection.ballots.push(ballot);
    }

    // Requerimentos que originaram eventos
    const requestsFile = await fetchYearFile(context.fetch, YEAR_FILES.eventRequests, year);
    sources.push(requestsFile.source);
    for (const request of requestsFile.items) {
      const list = eventRequests.get(request.idEvento) ?? [];
      list.push(idFromUri(request.uriRequerimento));
      eventRequests.set(request.idEvento, list);
    }

    // Eventos, órgãos e presenças
    const eventsFile = await fetchYearFile(context.fetch, YEAR_FILES.events, year);
    const organsFile = await fetchYearFile(context.fetch, YEAR_FILES.eventOrgans, year);
    const presencesFile = await fetchYearFile(context.fetch, YEAR_FILES.eventPresences, year);
    sources.push(eventsFile.source, organsFile.source, presencesFile.source);
    const yearSessions = selectPlenarySessions({
      events: eventsFile.items,
      eventOrgans: organsFile.items,
      presences: presencesFile.items,
      start,
      end,
      referenceDateTime,
    });
    for (const session of yearSessions.sessions) sessions.sessions.push(session);
    addPresences(yearSessions.presencesByDeputy);

    const yearMeetings = selectCommitteeMeetings({
      events: eventsFile.items,
      eventOrgans: organsFile.items,
      committeeOrganIds,
      start,
      end,
      referenceDateTime,
    });
    const meetingIds = new Set(yearMeetings.map((m) => m.id));
    for (const meeting of yearMeetings) committeeMeetings.push(meeting);
    const meetingPresences = new Map<number, Set<number>>();
    for (const presence of presencesFile.items) {
      if (!meetingIds.has(presence.idEvento)) continue;
      const set = meetingPresences.get(presence.idDeputado) ?? new Set<number>();
      set.add(presence.idEvento);
      meetingPresences.set(presence.idDeputado, set);
    }
    addPresences(meetingPresences);

    const organSiglas = new Map<number, string[]>();
    for (const o of organsFile.items) {
      if (!eventRequests.has(o.idEvento)) continue;
      const list = organSiglas.get(o.idEvento) ?? [];
      list.push(o.siglaOrgao);
      organSiglas.set(o.idEvento, list);
    }
    for (const event of eventsFile.items) {
      if (!eventRequests.has(event.id)) continue;
      requestedEventInfo.set(event.id, {
        date: event.dataHoraInicio.slice(0, 10),
        type: event.descricaoTipo,
        organs: organSiglas.get(event.id) ?? [],
        description: event.descricao,
        finished: event.situacao.startsWith("Encerrada"),
      });
    }

    // Autores de proposições (arquivo grande: reduzido na hora)
    const authorsFile = await fetchYearFile(context.fetch, YEAR_FILES.propositionAuthors, year);
    sources.push(authorsFile.source);
    addAuthors(authorship, authorsFile.items);

    log.info(
      `${year}: ${newVotes.length} votações nominais, ${yearSessions.sessions.length} sessões deliberativas, ${yearMeetings.length} reuniões de comissão`,
    );
  }
  selection.votes.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id.localeCompare(b.id));
  sessions.sessions.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id - b.id);
  committeeMeetings.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id - b.id);
  return {
    plenary: selection,
    orientations,
    sessions,
    committeeMeetings,
    eventRequests,
    requestedEventInfo,
    authorship,
  };
}
