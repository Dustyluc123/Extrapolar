// Fontes do Caderno 7: frentes, Mesa, lideranças (API), profissões e ocupações.
import {
  CAMARA_API_BASE,
  camaraBoardFileSchema,
  camaraFrontMembersFileSchema,
  camaraFrontsFileSchema,
  camaraLeadersPageSchema,
  camaraOccupationsFileSchema,
  camaraProfessionsFileSchema,
  parseOrThrow,
  type CamaraLeader,
} from "@extrapolar/shared";
import { cachedComputed, type CachedFetchContext } from "../lib/cached-fetch";
import { fetchStaticFile } from "./camara-arquivos";

export const fetchFronts = (c: CachedFetchContext) =>
  fetchStaticFile(c, {
    file: "frentes/json/frentes.json",
    name: "Frentes parlamentares",
    schema: camaraFrontsFileSchema,
  });
export const fetchFrontMembers = (c: CachedFetchContext) =>
  fetchStaticFile(c, {
    file: "frentesDeputados/json/frentesDeputados.json",
    name: "Deputados nas frentes parlamentares",
    schema: camaraFrontMembersFileSchema,
  });
export const fetchBoard = (c: CachedFetchContext) =>
  fetchStaticFile(c, {
    file: "legislaturasMesas/json/legislaturasMesas.json",
    name: "Composição da Mesa Diretora",
    schema: camaraBoardFileSchema,
  });
export const fetchProfessions = (c: CachedFetchContext) =>
  fetchStaticFile(c, {
    file: "deputadosProfissoes/json/deputadosProfissoes.json",
    name: "Profissões declaradas pelos deputados",
    schema: camaraProfessionsFileSchema,
  });
export const fetchOccupations = (c: CachedFetchContext) =>
  fetchStaticFile(c, {
    file: "deputadosOcupacoes/json/deputadosOcupacoes.json",
    name: "Ocupações declaradas pelos deputados",
    schema: camaraOccupationsFileSchema,
  });

const MAX_LEADER_PAGES = 200;

/** Líderes e vice-líderes da legislatura (API, todas as páginas; cache diário). */
export async function fetchLeaders(
  context: CachedFetchContext,
  legislatureId: number,
): Promise<CamaraLeader[]> {
  const base = `${CAMARA_API_BASE}/legislaturas/${legislatureId}/lideres?itens=100`;
  const result = await cachedComputed(
    context,
    `api/lideres/legislatura-${legislatureId}.json`,
    base,
    async () => {
      const all: CamaraLeader[] = [];
      for (let page = 1; page <= MAX_LEADER_PAGES; page++) {
        const url = `${base}&pagina=${page}`;
        const parsed = parseOrThrow(
          camaraLeadersPageSchema,
          await context.client.getJson(url),
          url,
        );
        for (const leader of parsed.dados) all.push(leader);
        if (!parsed.links.some((l) => l.rel === "next") || parsed.dados.length === 0) return all;
      }
      throw new Error(`Lideranças: mais de ${MAX_LEADER_PAGES} páginas; algo mudou na API.`);
    },
  );
  return result.data as CamaraLeader[];
}
