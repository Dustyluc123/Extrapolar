// Fonte: API de Dados Abertos da Câmara (/api/v2). Usada só quando não há arquivo estático.
import {
  CAMARA_API_BASE,
  camaraBlocPartiesPageSchema,
  camaraBlocsPageSchema,
  camaraDiscoursesPageSchema,
  camaraThemeRefsSchema,
  DataValidationError,
  camaraDeputyListPageSchema,
  camaraHistoryResponseSchema,
  parseOrThrow,
  type CamaraDeputyListItem,
  type CamaraHistoryEvent,
} from "@extrapolar/shared";
import { cachedComputed, fetchJsonCached, type CachedFetchContext } from "../lib/cached-fetch";

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

export interface Federation {
  name: string;
  parties: string[];
}

/**
 * Federações partidárias da legislatura e seus partidos (API /blocos, só os marcados como
 * federação). Usadas para achar a orientação de um partido federado. Blocos comuns não entram:
 * a API não informa a composição deles nas datas passadas (ADR 0014).
 */
export async function fetchFederations(
  context: CachedFetchContext,
  legislatureId: number,
): Promise<Federation[]> {
  const url = `${CAMARA_API_BASE}/blocos?idLegislatura=${legislatureId}&itens=100`;
  const { data } = await fetchJsonCached(
    context,
    `api/blocos/legislatura-${legislatureId}.json`,
    url,
  );
  const blocs = parseOrThrow(camaraBlocsPageSchema, data, url).dados.filter((b) => b.federacao);
  const federations: Federation[] = [];
  for (const bloc of blocs) {
    const partiesUrl = `${CAMARA_API_BASE}/blocos/${bloc.id}/partidos`;
    const result = await fetchJsonCached(
      context,
      `api/blocos/${bloc.id}-partidos.json`,
      partiesUrl,
    );
    const parties = parseOrThrow(camaraBlocPartiesPageSchema, result.data, partiesUrl).dados;
    if (parties.length === 0) {
      throw new Error(`A federação "${bloc.nome}" veio sem partidos em ${partiesUrl}.`);
    }
    federations.push({ name: bloc.nome, parties: parties.map((p) => p.sigla) });
  }
  return federations;
}

/** Lista oficial de temas de proposições (/referencias/proposicoes/codTema). */
export async function fetchThemeNames(context: CachedFetchContext): Promise<Map<number, string>> {
  const url = `${CAMARA_API_BASE}/referencias/proposicoes/codTema`;
  const { data } = await fetchJsonCached(context, "api/referencias/codTema.json", url);
  const parsed = parseOrThrow(camaraThemeRefsSchema, data, url).dados;
  return new Map(parsed.map((t) => [Number(t.cod), t.nome]));
}

/** Discurso reduzido: o cache não guarda transcrição nem resumo (ADRs 0015 e 0016). */
export interface DiscourseSummary {
  /** AAAA-MM-DDTHH:mm */
  date: string;
  phase: string | null;
  type: string;
}

/** Validade do cache de discursos: atualização semanal (ADR 0015). */
export const DISCOURSES_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface DeputyDiscourses {
  items: DiscourseSummary[];
  /** Meses (AAAA-MM) que a API não conseguiu devolver (erro persistente do lado da Câmara). */
  unavailableMonths: string[];
}

function lastDayOfMonth(year: number, month: number): string {
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Divide [from, to] em anos (se cobrir mais de um) ou em meses (se cobrir mais de um). */
export function splitDateRange(from: string, to: string): [string, string][] | null {
  const y0 = Number(from.slice(0, 4));
  const y1 = Number(to.slice(0, 4));
  if (y1 > y0) {
    return Array.from({ length: y1 - y0 + 1 }, (_, i) => {
      const y = y0 + i;
      return [i === 0 ? from : `${y}-01-01`, y === y1 ? to : `${y}-12-31`] as [string, string];
    });
  }
  const m0 = Number(from.slice(5, 7));
  const m1 = Number(to.slice(5, 7));
  if (m1 > m0) {
    return Array.from({ length: m1 - m0 + 1 }, (_, i) => {
      const m = m0 + i;
      const start = i === 0 ? from : `${y0}-${String(m).padStart(2, "0")}-01`;
      const end = m === m1 ? to : lastDayOfMonth(y0, m);
      return [start, end] as [string, string];
    });
  }
  return null;
}

/**
 * Discursos do deputado no período (todas as páginas), reduzidos e guardados em cache por 7 dias.
 * A API às vezes falha sempre para um período de um deputado (erro 500 do lado da Câmara); nesse
 * caso o período é dividido em anos e meses, e o mês que continuar falhando é registrado como
 * indisponível em vez de derrubar o pipeline.
 */
export async function fetchDeputyDiscourses(
  context: CachedFetchContext,
  deputyId: number,
  from: string,
  to: string,
  onStale: (reason: string) => void,
): Promise<DeputyDiscourses & { consultedAt: string }> {
  const fetchRange = async (start: string, end: string): Promise<DiscourseSummary[]> => {
    const base = `${CAMARA_API_BASE}/deputados/${deputyId}/discursos?dataInicio=${start}&dataFim=${end}&itens=100&ordenarPor=dataHoraInicio&ordem=DESC`;
    const items: DiscourseSummary[] = [];
    for (let page = 1; page <= MAX_PAGES * 5; page++) {
      const url = `${base}&pagina=${page}`;
      const parsed = parseOrThrow(
        camaraDiscoursesPageSchema,
        await context.client.getJson(url),
        url,
      );
      for (const d of parsed.dados) {
        items.push({
          date: d.dataHoraInicio,
          phase: d.faseEvento?.titulo ?? null,
          type: d.tipoDiscurso,
        });
      }
      if (!parsed.links.some((link) => link.rel === "next") || parsed.dados.length === 0) {
        return items;
      }
    }
    throw new Error(`Discursos do deputado ${deputyId}: mais páginas do que o esperado.`);
  };

  const fetchRobust = async (start: string, end: string): Promise<DeputyDiscourses> => {
    try {
      return { items: await fetchRange(start, end), unavailableMonths: [] };
    } catch (error) {
      if (error instanceof DataValidationError) throw error; // formato mudou: falha de verdade
      const parts = splitDateRange(start, end);
      if (!parts) return { items: [], unavailableMonths: [start.slice(0, 7)] };
      const result: DeputyDiscourses = { items: [], unavailableMonths: [] };
      for (const [a, b] of parts) {
        const part = await fetchRobust(a, b);
        for (const item of part.items) result.items.push(item);
        result.unavailableMonths.push(...part.unavailableMonths);
      }
      return result;
    }
  };

  const result = await cachedComputed(
    context,
    `api/discursos/${deputyId}.json`,
    `${CAMARA_API_BASE}/deputados/${deputyId}/discursos?dataInicio=${from}&dataFim=${to}`,
    () => fetchRobust(from, to),
    {
      ttlMs: DISCOURSES_TTL_MS,
      onStale,
      isValid: (data) =>
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as DeputyDiscourses).items) &&
        Array.isArray((data as DeputyDiscourses).unavailableMonths),
    },
  );
  const data = result.data as DeputyDiscourses;
  return { ...data, consultedAt: result.meta.savedAt };
}
