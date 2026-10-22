// Fonte: arquivos estáticos da Câmara (atualizados diariamente). Preferidos para cargas grandes.
// Catálogo de arquivos por ano + leitura com cache e validação Zod.
import type { z } from "zod";
import {
  CAMARA_FILES_BASE,
  camaraBallotsFileSchema,
  camaraEventOrgansFileSchema,
  camaraEventPresencesFileSchema,
  camaraEventsFileSchema,
  camaraOrientationsFileSchema,
  camaraVotesFileSchema,
  parseOrThrow,
  type SourceInfo,
} from "@extrapolar/shared";
import { fetchJsonCached, type CachedFetchContext } from "../lib/cached-fetch";
import { log } from "../lib/log";

export interface YearFileSpec<S extends z.ZodType<{ dados: unknown[] }>> {
  /** Pasta e prefixo do arquivo na Câmara (ex.: "votacoes" → votacoes/json/votacoes-2025.json). */
  folder: string;
  /** Nome legível para meta.json. */
  name: string;
  schema: S;
}

export const YEAR_FILES = {
  votes: { folder: "votacoes", name: "Votações", schema: camaraVotesFileSchema },
  ballots: { folder: "votacoesVotos", name: "Votos individuais", schema: camaraBallotsFileSchema },
  orientations: {
    folder: "votacoesOrientacoes",
    name: "Orientações de bancada",
    schema: camaraOrientationsFileSchema,
  },
  events: { folder: "eventos", name: "Eventos", schema: camaraEventsFileSchema },
  eventOrgans: {
    folder: "eventosOrgaos",
    name: "Órgãos dos eventos",
    schema: camaraEventOrgansFileSchema,
  },
  eventPresences: {
    folder: "eventosPresencaDeputados",
    name: "Presença de deputados em eventos",
    schema: camaraEventPresencesFileSchema,
  },
} as const;

export function yearFileUrl(folder: string, year: number): string {
  return `${CAMARA_FILES_BASE}/${folder}/json/${folder}-${year}.json`;
}

export interface YearFile<T> {
  year: number;
  items: T[];
  source: SourceInfo;
}

export async function fetchYearFile<S extends z.ZodType<{ dados: unknown[] }>>(
  context: CachedFetchContext,
  spec: YearFileSpec<S>,
  year: number,
): Promise<YearFile<z.output<S>["dados"][number]>> {
  const url = yearFileUrl(spec.folder, year);
  const result = await fetchJsonCached(context, `arquivos/${spec.folder}-${year}.json`, url, {
    checkLastModified: true,
  });
  log.info(`${spec.folder}-${year}.json (${result.origin})`);
  const parsed = parseOrThrow(spec.schema, result.data, url) as z.output<S>;
  return {
    year,
    items: parsed.dados as z.output<S>["dados"][number][],
    source: {
      id: `arquivo-${spec.folder}-${year}`,
      name: `${spec.name} — ${year}`,
      url,
      lastModified: result.meta.lastModified,
    },
  };
}

/** Atalhos usados pela Fase 0. */
export const fetchVotesFile = (context: CachedFetchContext, year: number) =>
  fetchYearFile(context, YEAR_FILES.votes, year);
export const fetchBallotsFile = (context: CachedFetchContext, year: number) =>
  fetchYearFile(context, YEAR_FILES.ballots, year);
