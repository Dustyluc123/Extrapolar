// Etapa 1: baixa as fontes (com cache em data/raw) e valida o formato de cada uma.
import {
  legislatureEndDateTime,
  legislatureStartDateTime,
  legislatureYears,
  type SourceInfo,
} from "@extrapolar/shared";
import { mapWithConcurrency } from "../lib/http";
import { log } from "../lib/log";
import { CAMARA_API_BASE, type CamaraOrientation } from "@extrapolar/shared";
import {
  currentDeputiesSourceUrl,
  fetchCurrentDeputies,
  fetchDeputyHistory,
  fetchFederations,
  historySourceUrl,
  type Federation,
} from "../sources/camara-api";
import { YEAR_FILES, fetchYearFile } from "../sources/camara-arquivos";
import type { DeputyWithHistory } from "../normalize/deputies";
import { selectPlenarySessions, type PlenarySessionsSelection } from "../normalize/sessions";
import {
  PLENARY_ORGAN,
  selectNominalPlenaryVotes,
  type PlenaryVotesSelection,
} from "../normalize/votes";
import type { PipelineContext } from "./context";

export interface FetchedSources {
  deputies: DeputyWithHistory[];
  /** Votações nominais de plenário e votos, já reduzidos ano a ano (ver fetchPlenaryYears). */
  plenary: PlenaryVotesSelection;
  /** Orientações de bancada em votações de plenário (todas; filtradas na normalização). */
  orientations: CamaraOrientation[];
  /** Sessões deliberativas do plenário e presenças. */
  sessions: PlenarySessionsSelection;
  federations: Federation[];
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

  const years = await fetchPlenaryYears(context, sources);
  return { deputies, federations, sources, ...years };
}

/**
 * Baixa, ano a ano, os arquivos do plenário (votações, votos, orientações, eventos e presenças) e,
 * logo depois de validar, reduz cada ano ao que interessa. Assim os arquivos brutos de todos os
 * anos nunca ficam na memória ao mesmo tempo (o de votos de um ano passa de 70 MB).
 */
async function fetchPlenaryYears(
  context: PipelineContext,
  sources: SourceInfo[],
): Promise<Pick<FetchedSources, "plenary" | "orientations" | "sessions">> {
  log.step("Baixando arquivos do plenário (arquivos estáticos da Câmara)");
  const { legislature, referenceDateTime, quality } = context;
  const selection: PlenaryVotesSelection = { votes: [], ballots: [] };
  const orientations: CamaraOrientation[] = [];
  const sessions: PlenarySessionsSelection = { sessions: [], presencesByDeputy: new Map() };
  const seenVotes = new Set<string>();

  for (const year of legislatureYears(legislature, referenceDateTime)) {
    const votesFile = await fetchYearFile(context.fetch, YEAR_FILES.votes, year);
    const ballotsFile = await fetchYearFile(context.fetch, YEAR_FILES.ballots, year);
    const orientationsFile = await fetchYearFile(context.fetch, YEAR_FILES.orientations, year);
    sources.push(votesFile.source, ballotsFile.source, orientationsFile.source);
    for (const orientation of orientationsFile.items) {
      if (orientation.siglaOrgao === PLENARY_ORGAN) orientations.push(orientation);
    }

    const eventsFile = await fetchYearFile(context.fetch, YEAR_FILES.events, year);
    const organsFile = await fetchYearFile(context.fetch, YEAR_FILES.eventOrgans, year);
    const presencesFile = await fetchYearFile(context.fetch, YEAR_FILES.eventPresences, year);
    sources.push(eventsFile.source, organsFile.source, presencesFile.source);
    const yearSessions = selectPlenarySessions({
      events: eventsFile.items,
      eventOrgans: organsFile.items,
      presences: presencesFile.items,
      start: legislatureStartDateTime(legislature),
      end: legislatureEndDateTime(legislature),
      referenceDateTime,
    });
    for (const session of yearSessions.sessions) sessions.sessions.push(session);
    for (const [deputyId, ids] of yearSessions.presencesByDeputy) {
      const set = sessions.presencesByDeputy.get(deputyId) ?? new Set<number>();
      for (const id of ids) set.add(id);
      sessions.presencesByDeputy.set(deputyId, set);
    }
    log.info(`${year}: ${yearSessions.sessions.length} sessões deliberativas do plenário`);

    const yearSelection = selectNominalPlenaryVotes({
      votes: votesFile.items,
      ballots: ballotsFile.items,
      start: legislatureStartDateTime(legislature),
      end: legislatureEndDateTime(legislature),
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
    log.info(`${year}: ${newVotes.length} votações nominais de plenário`);
  }
  selection.votes.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id.localeCompare(b.id));
  sessions.sessions.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id - b.id);
  return { plenary: selection, orientations, sessions };
}
