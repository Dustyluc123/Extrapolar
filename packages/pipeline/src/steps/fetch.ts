// Etapa 1: baixa as fontes (com cache em data/raw) e valida o formato de cada uma.
import {
  legislatureEndDateTime,
  legislatureStartDateTime,
  legislatureYears,
  type SourceInfo,
} from "@extrapolar/shared";
import { mapWithConcurrency } from "../lib/http";
import { log } from "../lib/log";
import {
  currentDeputiesSourceUrl,
  fetchCurrentDeputies,
  fetchDeputyHistory,
  historySourceUrl,
} from "../sources/camara-api";
import { fetchBallotsFile, fetchVotesFile } from "../sources/camara-arquivos";
import type { DeputyWithHistory } from "../normalize/deputies";
import { selectNominalPlenaryVotes, type PlenaryVotesSelection } from "../normalize/votes";
import type { PipelineContext } from "./context";

export interface FetchedSources {
  deputies: DeputyWithHistory[];
  /** Votações nominais de plenário e votos, já reduzidos ano a ano (ver fetchPlenaryVotes). */
  plenary: PlenaryVotesSelection;
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
  const plenary = await fetchPlenaryVotes(context, sources);
  return { deputies, plenary, sources };
}

/**
 * Baixa os arquivos de votações e votos de cada ano da legislatura e, logo depois de validar,
 * reduz cada ano às votações nominais de plenário. Fazer isso ano a ano evita manter na memória
 * os arquivos brutos de todos os anos ao mesmo tempo (o de votos de um ano passa de 70 MB).
 */
async function fetchPlenaryVotes(
  context: PipelineContext,
  sources: SourceInfo[],
): Promise<PlenaryVotesSelection> {
  log.step("Baixando votações e votos (arquivos estáticos da Câmara)");
  const { legislature, referenceDateTime, quality } = context;
  const selection: PlenaryVotesSelection = { votes: [], ballots: [] };
  const seenVotes = new Set<string>();

  for (const year of legislatureYears(legislature, referenceDateTime)) {
    const votesFile = await fetchVotesFile(context.fetch, year);
    const ballotsFile = await fetchBallotsFile(context.fetch, year);
    sources.push(votesFile.source, ballotsFile.source);

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
  return selection;
}
