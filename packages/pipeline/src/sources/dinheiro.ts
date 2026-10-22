// Fontes do Caderno 6: cota parlamentar (Câmara), funcionários (Câmara) e emendas (CGU).
import {
  camaraCeapRowSchema,
  camaraStaffFileSchema,
  cguAmendmentRowSchema,
} from "@extrapolar/shared";
import type { CachedFetchContext } from "../lib/cached-fetch";
import { fetchStaticFile } from "./camara-arquivos";
import { fetchZippedCsv } from "./zipped-csv";

export const ceapUrl = (year: number) => `https://www.camara.leg.br/cotas/Ano-${year}.csv.zip`;

export function fetchCeapYear(context: CachedFetchContext, year: number) {
  return fetchZippedCsv(context, {
    url: ceapUrl(year),
    cacheKey: `cotas/Ano-${year}.csv.zip`,
    entry: null,
    encoding: "utf-8",
    rowSchema: camaraCeapRowSchema,
    source: {
      id: `cota-${year}`,
      name: `Cota parlamentar (CEAP) — despesas de ${year}`,
      url: ceapUrl(year),
    },
  });
}

/** Download em lote do Portal da Transparência (redireciona para o arquivo da CGU). */
export const AMENDMENTS_URL =
  "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO";

export function fetchAmendments(context: CachedFetchContext) {
  return fetchZippedCsv(context, {
    url: AMENDMENTS_URL,
    cacheKey: "cgu/EmendasParlamentares.zip",
    entry: "EmendasParlamentares.csv",
    encoding: "latin1",
    rowSchema: cguAmendmentRowSchema,
    source: {
      id: "cgu-emendas",
      name: "Portal da Transparência (CGU) — emendas parlamentares",
      url: AMENDMENTS_URL,
    },
  });
}

export function fetchStaff(context: CachedFetchContext) {
  return fetchStaticFile(context, {
    file: "funcionarios/json/funcionarios.json",
    name: "Funcionários da Câmara (retrato do dia anterior)",
    schema: camaraStaffFileSchema,
  });
}
