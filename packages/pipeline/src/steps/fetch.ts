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
  type CamaraLeader,
  type CguAmendmentRow,
  type SourceInfo,
} from "@extrapolar/shared";
import type { CommitteeMeeting } from "@extrapolar/metrics";
import { HttpClient, mapWithConcurrency } from "../lib/http";
import { log } from "../lib/log";
import {
  currentDeputiesSourceUrl,
  fetchCurrentDeputies,
  fetchDeputyDiscourses,
  fetchDeputyHistory,
  fetchFederations,
  type DeputyDiscourses,
  fetchThemeNames,
  historySourceUrl,
  fetchPropositionDetail,
  searchProposition,
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
import { reduceCeap, type DeputyCeap } from "../normalize/money";
import { fetchAmendments, fetchCeapYear, fetchStaff } from "../sources/dinheiro";
import {
  fetchBoard,
  fetchFrontMembers,
  fetchFronts,
  fetchLeaders,
  fetchOccupations,
  fetchProfessions,
} from "../sources/articulacao";
import type { FrontMembership } from "@extrapolar/metrics";
import {
  addThemes,
  reducePropositions,
  type PropositionsReduction,
} from "../normalize/propositions";
import { selectPlenarySessions, type PlenarySessionsSelection } from "../normalize/sessions";
import {
  PLENARY_ORGAN,
  selectNominalPlenaryVotes,
  type PlenaryVotesSelection,
} from "../normalize/votes";
import { isSecretVote } from "../normalize/votes";
import {
  MERIT_PROPOSITION_TYPES,
  canonicalType,
  parseMeritDescription,
  propositionKey,
  type PropositionInfo,
} from "../normalize/eligible-votes";
import type { PipelineContext } from "./context";

export interface EventInfo {
  date: string;
  type: string;
  organs: string[];
  description: string;
  finished: boolean;
}

export interface PlenaryVoteInfo {
  id: string;
  date: string;
  /** Data e hora do registro (para ordenar votações do mesmo dia). */
  dateTime: string;
  description: string;
  approval: 0 | 1 | undefined;
  secret: boolean;
  /** Contagem oficial do arquivo de votações. */
  official: { yes: number; no: number; others: number };
}

export interface GameVotesSources {
  info: Map<string, PlenaryVoteInfo>;
  /** Proposições ligadas a cada votação (arquivo votacoesProposicoes). */
  linked: Map<string, PropositionInfo[]>;
  /** Proposições de mérito por "SIGLA número/ano" (arquivos anuais + busca na API). */
  lookup: Map<string, PropositionInfo>;
}

export interface DeputyRecord {
  birthDate: string | null;
  birthState: string | null;
  firstLegislature: number;
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
  /** Proposições reduzidas (tipos dos cadernos 3 e 4) e contagens por tipo. */
  propositions: PropositionsReduction;
  /** Temas oficiais das proposições principais. */
  propositionThemes: Map<number, number[]>;
  /** Nomes oficiais dos temas. */
  themeNames: Map<number, string>;
  /** Cota parlamentar reduzida por deputado (mês de competência × categoria). */
  ceap: Map<number, DeputyCeap>;
  /** Linhas de emendas da CGU (todas; a ligação com deputados é feita na normalização). */
  amendmentRows: CguAmendmentRow[];
  /** Secretários parlamentares por gabinete (retrato do dia anterior). */
  staff: { counts: Map<number, number>; lastModified: string | null };
  /** Caderno 7: frentes, Mesa, lideranças, profissões e ocupações (só deputados atuais). */
  articulation: {
    fronts: { id: number; titulo: string }[];
    frontMemberships: Map<number, FrontMembership[]>;
    board: Map<number, { cargo: string; start: string; end: string | null }[]>;
    leaders: Map<number, CamaraLeader[]>;
    professions: Map<number, string[]>;
    occupations: Map<
      number,
      {
        titulo: string;
        entidade: string | null;
        uf: string | null;
        inicio: string | null;
        fim: string | null;
      }[]
    >;
  };
  /** Dados das votações nominais de plenário para os jogos (Fase 2, ADR 0019). */
  gameVotes: GameVotesSources;
  /** Nascimento e primeira legislatura de cada deputado atual (arquivo estático). */
  deputyRecords: Map<number, DeputyRecord>;
  /** Discursos por deputado (API, atualização semanal — ADR 0015). */
  discourses: Map<number, DeputyDiscourses & { consultedAt: string }>;
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

  log.step("Discursos de cada deputado (API da Câmara; cache de 7 dias)");
  const from = context.legislature.start;
  const to = context.referenceDateTime.slice(0, 10);
  let discoursesDone = 0;
  let stale = 0;
  // Menos tentativas aqui: um erro persistente da API leva à divisão do período em anos e meses.
  const discourseContext = {
    ...context.fetch,
    client: new HttpClient({
      maxRetries: 2,
      onRetry: ({ url, attempt, reason }) =>
        log.info(`nova tentativa ${attempt} (${reason}): ${url.replace(/^.*\/deputados\//, "")}`),
    }),
  };
  const discourseList = await mapWithConcurrency(list, 2, async (item) => {
    const result = await fetchDeputyDiscourses(discourseContext, item.id, from, to, (reason) => {
      stale++;
      log.warn(`Discursos de ${item.id}: usando cache antigo (${reason})`);
    });
    discoursesDone++;
    if (discoursesDone % 100 === 0 || discoursesDone === list.length) {
      log.info(`${discoursesDone}/${list.length} deputados`);
    }
    return [item.id, result] as const;
  });
  if (stale > 0) {
    context.quality.add(
      "discursos-cache-antigo",
      "A API de discursos falhou para alguns deputados; foram usados os dados da consulta anterior.",
      stale,
    );
  }
  const discourses = new Map(discourseList);
  const unavailable = [...discourses.values()].reduce((n, d) => n + d.unavailableMonths.length, 0);
  if (unavailable > 0) {
    context.quality.add(
      "discursos-mes-indisponivel",
      "Meses de discursos que a API da Câmara não devolveu (erro persistente); indicados na ficha.",
      unavailable,
    );
  }
  sources.push({
    id: "api-discursos",
    name: "API da Câmara — discursos de cada deputado (atualização semanal)",
    url: `${CAMARA_API_BASE}/deputados/{id}/discursos`,
    lastModified: null,
  });

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

  const themeNames = await fetchThemeNames(context.fetch);
  sources.push({
    id: "api-temas",
    name: "API da Câmara — lista oficial de temas",
    url: `${CAMARA_API_BASE}/referencias/proposicoes/codTema`,
    lastModified: null,
  });

  const deputyIds = new Set(list.map((item) => item.id));
  const years = await fetchYears(context, sources, committeeOrganIds, deputyIds);

  log.step("Jogos: proposições citadas que não estão nos arquivos (API da Câmara)");
  const missing = await resolveCitedPropositions(context, years.gameVotes);
  log.info(`${missing.found} achada(s) na API; ${missing.notFound} não encontrada(s)`);
  if (missing.found + missing.notFound > 0) {
    sources.push({
      id: "api-proposicoes-busca",
      name: "API da Câmara — busca de proposições por sigla, número e ano",
      url: `${CAMARA_API_BASE}/proposicoes`,
      lastModified: null,
    });
  }

  log.step("Deputados de todas as legislaturas (arquivo estático): nascimento e estreia");
  const recordsFile = await fetchStaticFile(context.fetch, STATIC_FILES.deputyRecords);
  sources.push(recordsFile.source);
  const deputyRecords = new Map<number, DeputyRecord>();
  for (const record of recordsFile.items) {
    const id = idFromUri(record.uri);
    if (!deputyIds.has(id)) continue;
    deputyRecords.set(id, {
      birthDate: record.dataNascimento ? record.dataNascimento : null,
      birthState: record.ufNascimento?.trim() ? record.ufNascimento.trim() : null,
      firstLegislature: record.idLegislaturaInicial,
    });
  }

  log.step("Cota parlamentar (arquivos da Câmara)");
  const ceap = new Map<number, DeputyCeap>();
  for (const year of legislatureYears(context.legislature, context.referenceDateTime)) {
    const file = await fetchCeapYear(context.fetch, year);
    sources.push(file.source);
    reduceCeap(ceap, file.rows, deputyIds);
  }

  log.step("Funcionários dos gabinetes (arquivo da Câmara)");
  const staffFile = await fetchStaff(context.fetch);
  sources.push(staffFile.source);
  const staffCounts = new Map<number, number>();
  for (const person of staffFile.items) {
    if (person.grupo !== "Secretário Parlamentar") continue;
    const match = /\/deputados\/(\d+)$/.exec(person.uriLotacao);
    if (!match) continue;
    const id = Number(match[1]);
    staffCounts.set(id, (staffCounts.get(id) ?? 0) + 1);
  }

  log.step("Frentes, Mesa, lideranças e perfil (arquivos e API da Câmara)");
  const legislatureId = context.legislature.id;
  const push = <T>(map: Map<number, T[]>, id: number, value: T) => {
    const list = map.get(id) ?? [];
    list.push(value);
    map.set(id, list);
  };
  const frontsFile = await fetchFronts(context.fetch);
  const frontMembersFile = await fetchFrontMembers(context.fetch);
  const boardFile = await fetchBoard(context.fetch);
  const professionsFile = await fetchProfessions(context.fetch);
  const occupationsFile = await fetchOccupations(context.fetch);
  sources.push(
    frontsFile.source,
    frontMembersFile.source,
    boardFile.source,
    professionsFile.source,
    occupationsFile.source,
  );
  const leadersList = await fetchLeaders(context.fetch, legislatureId);
  sources.push({
    id: "api-lideres",
    name: "API da Câmara — líderes e vice-líderes da legislatura",
    url: `${CAMARA_API_BASE}/legislaturas/${legislatureId}/lideres`,
    lastModified: null,
  });
  const frontMemberships = new Map<number, FrontMembership[]>();
  let frontRowsWithoutId = 0;
  for (const m of frontMembersFile.items) {
    if (m.idLegislatura !== legislatureId) continue;
    if (m.idDeputado === undefined) {
      frontRowsWithoutId++;
      continue;
    }
    if (deputyIds.has(m.idDeputado)) {
      push(frontMemberships, m.idDeputado, { frontId: m.id, role: m.tituloDeputado });
    }
  }
  if (frontRowsWithoutId > 0) {
    context.quality.add(
      "frente-sem-id-deputado",
      "Linhas de membros de frentes sem id do deputado (só com o nome); ignoradas.",
      frontRowsWithoutId,
    );
  }
  const board = new Map<number, { cargo: string; start: string; end: string | null }[]>();
  for (const b of boardFile.items) {
    const id = Number(b.idDeputado);
    if (b.idLegislatura === String(legislatureId) && deputyIds.has(id)) {
      push(board, id, {
        cargo: b.cargo,
        start: b.dataInicio.slice(0, 10),
        end: b.dataFim ? b.dataFim.slice(0, 10) : null,
      });
    }
  }
  const leaders = new Map<number, CamaraLeader[]>();
  for (const l of leadersList)
    if (deputyIds.has(l.parlamentar.id)) push(leaders, l.parlamentar.id, l);
  const professions = new Map<number, string[]>();
  for (const p of professionsFile.items) {
    const title = p.titulo.trim();
    if (title && deputyIds.has(p.id) && !(professions.get(p.id) ?? []).includes(title))
      push(professions, p.id, title);
  }
  const occupations: FetchedSources["articulation"]["occupations"] = new Map();
  for (const o of occupationsFile.items) {
    const title = o.titulo?.trim();
    if (!title || !deputyIds.has(o.id)) continue;
    const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
    push(occupations, o.id, {
      titulo: title,
      entidade: clean(o.entidade),
      uf: clean(o.entidadeUF),
      inicio: clean(o.anoInicio),
      fim: clean(o.anoFim),
    });
  }
  const articulation: FetchedSources["articulation"] = {
    fronts: frontsFile.items
      .filter((f) => f.idLegislatura === legislatureId)
      .map((f) => ({ id: f.id, titulo: f.titulo.trim() }))
      .sort((a, b) => a.id - b.id),
    frontMemberships,
    board,
    leaders,
    professions,
    occupations,
  };

  log.step("Emendas parlamentares (Portal da Transparência, CGU)");
  const amendments = await fetchAmendments(context.fetch);
  sources.push(amendments.source);
  log.info(`${amendments.rows.length} linhas de emendas`);
  return {
    deputyRecords,
    articulation,
    ceap,
    amendmentRows: amendments.rows,
    staff: { counts: staffCounts, lastModified: staffFile.source.lastModified },
    discourses,
    themeNames,
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
  deputyIds: ReadonlySet<number>,
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
    | "propositions"
    | "propositionThemes"
    | "gameVotes"
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
  const propositions: PropositionsReduction = { propositions: new Map(), typeCounts: new Map() };
  const propositionThemes = new Map<number, number[]>();
  const limit = end < referenceDateTime ? end : referenceDateTime;
  const seenVotes = new Set<string>();
  const gameVotes: GameVotesSources = { info: new Map(), linked: new Map(), lookup: new Map() };
  const meritTypes = new Set<string>(MERIT_PROPOSITION_TYPES);

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

    // Jogos: descrição, resultado oficial e proposições ligadas a cada votação nominal
    for (const vote of votesFile.items) {
      if (!newIds.has(vote.id)) continue;
      gameVotes.info.set(vote.id, {
        id: vote.id,
        date: vote.data,
        dateTime: vote.dataHoraRegistro || `${vote.data}T00:00:00`,
        description: vote.descricao,
        approval: vote.aprovacao,
        secret: isSecretVote(vote),
        official: { yes: vote.votosSim, no: vote.votosNao, others: vote.votosOutros },
      });
    }
    const votePropsFile = await fetchYearFile(context.fetch, YEAR_FILES.voteProps, year);
    sources.push(votePropsFile.source);
    for (const row of votePropsFile.items) {
      if (!newIds.has(row.idVotacao)) continue;
      const p = row.proposicao_;
      if (p.ano === undefined) continue; // relatório, emenda ou outro item acessório
      const list = gameVotes.linked.get(row.idVotacao) ?? [];
      list.push({ id: p.id, type: p.siglaTipo, number: p.numero, year: p.ano, summary: p.ementa });
      gameVotes.linked.set(row.idVotacao, list);
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

    // Autores e proposições (arquivos grandes: reduzidos na hora; autores antes das proposições)
    const authorsFile = await fetchYearFile(context.fetch, YEAR_FILES.propositionAuthors, year);
    sources.push(authorsFile.source);
    addAuthors(authorship, authorsFile.items);
    const propositionsFile = await fetchYearFile(context.fetch, YEAR_FILES.propositions, year);
    sources.push(propositionsFile.source);
    for (const p of propositionsFile.items) {
      if (!meritTypes.has(canonicalType(p.siglaTipo))) continue;
      gameVotes.lookup.set(propositionKey(p.siglaTipo, p.numero, p.ano), {
        id: p.id,
        type: p.siglaTipo,
        number: p.numero,
        year: p.ano,
        summary: p.ementa,
      });
    }
    reducePropositions({
      target: propositions,
      items: propositionsFile.items,
      authorship,
      deputyIds,
      start,
      limit,
    });
    const themesFile = await fetchYearFile(context.fetch, YEAR_FILES.propositionThemes, year);
    sources.push(themesFile.source);
    addThemes(propositionThemes, themesFile.items, propositions.propositions);

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
    propositions,
    propositionThemes,
    gameVotes,
  };
}

/**
 * Proposições citadas na descrição de votações de mérito que não estão ligadas à votação nem nos
 * arquivos anuais da legislatura (projetos antigos, como a PEC 45/2019): busca na API.
 */
async function resolveCitedPropositions(
  context: PipelineContext,
  gameVotes: GameVotesSources,
): Promise<{ found: number; notFound: number }> {
  const wanted = new Map<
    string,
    { type: string; number: number; year: number; voteIds: string[] }
  >();
  for (const info of gameVotes.info.values()) {
    if (info.secret) continue;
    const merit = parseMeritDescription(info.description);
    if (!merit?.ref) continue;
    const key = propositionKey(merit.ref.type, merit.ref.number, merit.ref.year);
    const linked = gameVotes.linked.get(info.id) ?? [];
    if (linked.some((p) => propositionKey(p.type, p.number, p.year) === key)) continue;
    if (gameVotes.lookup.has(key)) continue;
    const entry = wanted.get(key) ?? { ...merit.ref, voteIds: [] };
    entry.voteIds.push(info.id);
    wanted.set(key, entry);
  }
  let found = 0;
  let notFound = 0;
  for (const [key, ref] of wanted) {
    // O antigo PDC (até 2019) é o PDL de hoje.
    const types = ref.type === "PDL" ? ["PDL", "PDC"] : [ref.type];
    let result = null;
    for (const type of types) {
      result = await searchProposition(context.fetch, type, ref.number, ref.year);
      if (result) break;
    }
    if (!result) result = await renumbered(context, gameVotes, ref);
    if (result) {
      gameVotes.lookup.set(key, result);
      found++;
    } else {
      notFound++;
      log.warn(`Proposição citada não encontrada na API: ${key}`);
    }
  }
  return { found, notFound };
}

/**
 * Proposição renumerada: a Câmara deu número novo a projetos antigos (ex.: o PL 6.385/2016 é hoje
 * o PL 2.721/2023), e a descrição da votação cita o número antigo. Vale só se todas as votações
 * que citam o número antigo têm uma única proposição ligada, do mesmo tipo, apresentada no ano
 * citado. Na dúvida, não vale.
 */
async function renumbered(
  context: PipelineContext,
  gameVotes: GameVotesSources,
  ref: { type: string; number: number; year: number; voteIds: string[] },
): Promise<PropositionInfo | null> {
  const ids = new Set<number>();
  for (const voteId of ref.voteIds) {
    const candidates = (gameVotes.linked.get(voteId) ?? []).filter(
      (p) => canonicalType(p.type) === canonicalType(ref.type),
    );
    if (candidates.length !== 1) return null;
    ids.add(candidates[0]!.id);
  }
  if (ids.size !== 1) return null;
  const detail = await fetchPropositionDetail(context.fetch, [...ids][0]!);
  if (canonicalType(detail.type) !== canonicalType(ref.type) || detail.presentedYear !== ref.year) {
    return null;
  }
  log.info(
    `${ref.type} ${ref.number}/${ref.year} renumerado: hoje ${detail.type} ${detail.number}/${detail.year}`,
  );
  return {
    id: detail.id,
    type: detail.type,
    number: detail.number,
    year: detail.year,
    summary: detail.summary,
  };
}
