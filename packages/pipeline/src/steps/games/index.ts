// Dados dos jogos (Fase 2): catálogo de votações elegíveis, deputados na ordem dos votos
// compactos e estado do sorteio diário. Cada jogo acrescenta o seu arquivo.
import {
  drawStateFileSchema,
  gameDeputiesFileSchema,
  gameVotesFileSchema,
} from "@extrapolar/shared";
import { log } from "../../lib/log";
import { CONTENT_DIR, GENERATED_DIR } from "../../lib/paths";
import { join } from "node:path";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";
import type { ComputedData } from "../compute";
import type { OutputFile } from "../publish";
import { buildCatalog, buildGameDeputies } from "./catalog";
import { DrawState, loadDrawState } from "./draw";
import { readPlainSummaries } from "./summaries";

export async function buildGames(
  context: PipelineContext,
  data: NormalizedData,
  _computed: ComputedData,
): Promise<OutputFile[]> {
  log.step("Jogos: votações elegíveis e sorteio do dia");
  const today = context.referenceDateTime.slice(0, 10);
  const summaries = await readPlainSummaries(join(CONTENT_DIR, "resumos"));
  const catalog = buildCatalog({
    sources: data.gameVotes,
    ballots: data.plenary.ballots,
    summaries,
    onUnusedSummary: (voteId) => {
      log.warn(`content/resumos/${voteId}.md não corresponde a uma votação elegível`);
      context.quality.add(
        "resumo-sem-votacao-elegivel",
        "Resumo em content/resumos sem votação elegível correspondente; não publicado.",
      );
    },
  });
  const { votes, excluded, nominalVotes } = catalog.file;
  log.info(
    `${votes.length} votações elegíveis de ${nominalVotes} nominais (fora: ${Object.entries(
      excluded,
    )
      .filter(([, n]) => n > 0)
      .map(([reason, n]) => `${reason} ${n}`)
      .join(
        ", ",
      )}); ${[...summaries.values()].filter((s) => s.reviewed).length} resumo(s) revisado(s)`,
  );
  const deputies = buildGameDeputies(data.deputies);
  const draw = new DrawState(await loadDrawState(GENERATED_DIR), today);

  return [
    { name: "jogos/votacoes.json", schema: gameVotesFileSchema, data: catalog.file },
    { name: "jogos/deputados.json", schema: gameDeputiesFileSchema, data: deputies },
    { name: "jogos/sorteio.json", schema: drawStateFileSchema, data: draw.toFile() },
  ];
}
