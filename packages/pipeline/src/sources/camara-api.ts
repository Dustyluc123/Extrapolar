// Fonte: API de Dados Abertos da Câmara (/api/v2). Usada só quando não há arquivo estático.
import {
  CAMARA_API_BASE,
  camaraDeputyListPageSchema,
  camaraHistoryResponseSchema,
  parseOrThrow,
  type CamaraDeputyListItem,
  type CamaraHistoryEvent,
} from "@extrapolar/shared";
import { fetchJsonCached, type CachedFetchContext } from "../lib/cached-fetch";

const PAGE_SIZE = 100;
/** Trava de segurança: a Câmara tem 513 cadeiras. */
const MAX_PAGES = 20;

export const currentDeputiesSourceUrl = `${CAMARA_API_BASE}/deputados`;
export const historySourceUrl = `${CAMARA_API_BASE}/deputados/{id}/historico`;

/** Deputados em exercício hoje (sem filtro de legislatura a API devolve só quem está em exercício). */
export async function fetchCurrentDeputies(
  context: CachedFetchContext,
): Promise<CamaraDeputyListItem[]> {
  const deputies: CamaraDeputyListItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${CAMARA_API_BASE}/deputados?itens=${PAGE_SIZE}&pagina=${page}&ordem=ASC&ordenarPor=nome`;
    const { data } = await fetchJsonCached(context, `api/deputados/pagina-${page}.json`, url);
    const parsed = parseOrThrow(camaraDeputyListPageSchema, data, `${url}`);
    deputies.push(...parsed.dados);
    const hasNext = parsed.links.some((link) => link.rel === "next");
    if (!hasNext || parsed.dados.length === 0) return deputies;
  }
  throw new Error(`A lista de deputados passou de ${MAX_PAGES} páginas; algo mudou na API.`);
}

export async function fetchDeputyHistory(
  context: CachedFetchContext,
  deputyId: number,
): Promise<CamaraHistoryEvent[]> {
  const url = `${CAMARA_API_BASE}/deputados/${deputyId}/historico`;
  const { data } = await fetchJsonCached(context, `api/historico/${deputyId}.json`, url);
  return parseOrThrow(camaraHistoryResponseSchema, data, url).dados;
}
