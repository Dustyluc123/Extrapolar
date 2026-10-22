// Etapa 1: baixa as fontes (com cache em data/raw) e valida o formato de cada uma.
import type { SourceInfo } from "@extrapolar/shared";
import { mapWithConcurrency } from "../lib/http";
import { log } from "../lib/log";
import {
  currentDeputiesSourceUrl,
  fetchCurrentDeputies,
  fetchDeputyHistory,
  historySourceUrl,
} from "../sources/camara-api";
import type { DeputyWithHistory } from "../normalize/deputies";
import type { PipelineContext } from "./context";

export interface FetchedSources {
  deputies: DeputyWithHistory[];
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
  return { deputies, sources };
}
