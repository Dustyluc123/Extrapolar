// Ponto de entrada do pipeline: `pnpm pipeline` (ou `pnpm pipeline -- --refresh`).
// fetch → normalize → compute → publish. Qualquer erro interrompe sem publicar.
import {
  GENERATED_SCHEMA_VERSION,
  PROJECT_NAME,
  datasetMetaSchema,
  deputiesFileSchema,
  deputyDetailSchema,
  frontsIndexSchema,
  getLegislature,
  metricsIndexSchema,
  type DatasetMeta,
  type DeputiesFile,
} from "@extrapolar/shared";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { FileCache } from "./lib/cache";
import { HttpClient } from "./lib/http";
import { log } from "./lib/log";
import { GENERATED_DIR, RAW_DIR } from "./lib/paths";
import { toBrasiliaLocalDateTime } from "./lib/time";
import { QualityLog } from "./normalize/quality";
import { compute } from "./steps/compute";
import type { PipelineContext } from "./steps/context";
import { fetchSources } from "./steps/fetch";
import { normalize } from "./steps/normalize";
import { publish } from "./steps/publish";
import { buildGames } from "./steps/games";

export interface RunOptions {
  refresh?: boolean;
  now?: Date;
}

export async function runPipeline(options: RunOptions = {}): Promise<void> {
  const now = options.now ?? new Date();
  const legislature = getLegislature();
  const context: PipelineContext = {
    legislature,
    referenceDateTime: toBrasiliaLocalDateTime(now),
    generatedAt: now.toISOString(),
    quality: new QualityLog(),
    fetch: {
      client: new HttpClient({
        onRetry: ({ url, attempt, delayMs, reason }) =>
          log.warn(`Nova tentativa ${attempt} em ${delayMs} ms (${reason}): ${url}`),
      }),
      cache: new FileCache(RAW_DIR),
      refresh: options.refresh ?? false,
    },
  };

  log.info(
    `${PROJECT_NAME} — pipeline da ${legislature.id}ª legislatura, referência ${context.referenceDateTime} (Brasília)`,
  );
  const fetched = await fetchSources(context);
  const data = normalize(context, fetched);
  const computed = compute(context, data);
  const games = await buildGames(context, data, computed);

  const quality = context.quality.list();
  for (const issue of quality) log.warn(`${issue.message} (${issue.count}x)`);

  const meta: DatasetMeta = {
    schemaVersion: GENERATED_SCHEMA_VERSION,
    generatedAt: context.generatedAt,
    referenceDateTime: context.referenceDateTime,
    legislature: { id: legislature.id, start: legislature.start, end: legislature.end },
    sources: fetched.sources,
    dataQuality: quality,
    totals: computed.totals,
  };
  const deputiesFile: DeputiesFile = {
    schemaVersion: GENERATED_SCHEMA_VERSION,
    legislatureId: legislature.id,
    deputies: data.deputies,
  };

  await publish(
    GENERATED_DIR,
    [
      { name: "deputados.json", schema: deputiesFileSchema, data: deputiesFile },
      ...computed.details.map((detail) => ({
        name: `deputados/${detail.deputyId}.json`,
        schema: deputyDetailSchema,
        data: detail,
      })),
      { name: "metricas.json", schema: metricsIndexSchema, data: computed.metricsIndex },
      { name: "frentes.json", schema: frontsIndexSchema, data: computed.fronts },
      { name: "meta.json", schema: datasetMetaSchema, data: meta },
      ...games,
    ],
    { ownedDirs: ["deputados"] },
  );
  // participacao.json (Fase 0) foi substituído pelos arquivos por deputado (ADR 0012).
  await rm(join(GENERATED_DIR, "participacao.json"), { force: true });
  log.step("Pronto");
}

// Só executa quando chamado direto (tsx src/index.ts), não quando importado nos testes.
if (import.meta.url === `file://${process.argv[1]}`) {
  runPipeline({ refresh: process.argv.includes("--refresh") }).catch((error: unknown) => {
    console.error(`\n✖ Pipeline interrompido. Nada foi publicado.\n`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
