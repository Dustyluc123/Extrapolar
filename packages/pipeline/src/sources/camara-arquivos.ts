// Fonte: arquivos estáticos da Câmara (atualizados diariamente). Preferidos para cargas grandes.
import {
  ballotsFileUrl,
  camaraBallotsFileSchema,
  camaraVotesFileSchema,
  parseOrThrow,
  votesFileUrl,
  type CamaraBallot,
  type CamaraVote,
  type SourceInfo,
} from "@extrapolar/shared";
import { fetchJsonCached, type CachedFetchContext } from "../lib/cached-fetch";
import { log } from "../lib/log";

export interface YearFile<T> {
  year: number;
  items: T[];
  source: SourceInfo;
}

export async function fetchVotesFile(
  context: CachedFetchContext,
  year: number,
): Promise<YearFile<CamaraVote>> {
  const url = votesFileUrl(year);
  const result = await fetchJsonCached(context, `arquivos/votacoes-${year}.json`, url, {
    checkLastModified: true,
  });
  log.info(`votacoes-${year}.json (${result.origin})`);
  return {
    year,
    items: parseOrThrow(camaraVotesFileSchema, result.data, url).dados,
    source: {
      id: `arquivo-votacoes-${year}`,
      name: `Arquivo de votações de ${year}`,
      url,
      lastModified: result.meta.lastModified,
    },
  };
}

export async function fetchBallotsFile(
  context: CachedFetchContext,
  year: number,
): Promise<YearFile<CamaraBallot>> {
  const url = ballotsFileUrl(year);
  const result = await fetchJsonCached(context, `arquivos/votacoesVotos-${year}.json`, url, {
    checkLastModified: true,
  });
  log.info(`votacoesVotos-${year}.json (${result.origin})`);
  return {
    year,
    items: parseOrThrow(camaraBallotsFileSchema, result.data, url).dados,
    source: {
      id: `arquivo-votos-${year}`,
      name: `Arquivo de votos individuais de ${year}`,
      url,
      lastModified: result.meta.lastModified,
    },
  };
}
