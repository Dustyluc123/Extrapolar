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
import { buildDle } from "./dle";
import { buildPlacar } from "./placar";
import { buildLatestVote, buildVoteRound } from "./vote-round";
import { DrawState, drawSecret, loadDrawState } from "./draw";
import { readPlainSummaries } from "./summaries";

export async function buildGames(
  context: PipelineContext,
  data: NormalizedData,
  computed: ComputedData,
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
  const secret = drawSecret();

  const dle = buildDle({
    deputies: data.deputies,
    details: new Map(computed.details.map((d) => [d.deputyId, d])),
    records: data.deputyRecords,
    federations: data.federations,
    today,
    draw,
    secret,
    onMissingRecord: (id) => {
      log.warn(
        `Deputado ${id} sem registro no arquivo deputados.json (nascimento e estreia sem dado)`,
      );
      context.quality.add(
        "jogos-deputado-sem-registro",
        "Deputado em exercício sem registro no arquivo de todos os deputados (Dle mostra sem dado).",
      );
    },
  });
  log.info(`Dle: ${dle.length} estados`);

  const placar = buildPlacar({ catalog, deputies, today, draw, secret });
  log.info(`Placar: ${(placar.data as { poolSize: number }).poolSize} votações no sorteio`);

  const round = buildVoteRound({
    catalog,
    deputies,
    orientationsByVote: data.orientationsByVote,
    federations: data.federations,
    today,
  });
  log.info(
    `Vote você também: ${(round.data as { votes: unknown[] }).votes.length} votações na rodada`,
  );

  const latest = buildLatestVote({
    catalog,
    deputies,
    orientationsByVote: data.orientationsByVote,
    federations: data.federations,
  });

  return [
    { name: "jogos/votacoes.json", schema: gameVotesFileSchema, data: catalog.file },
    { name: "jogos/deputados.json", schema: gameDeputiesFileSchema, data: deputies },
    ...dle,
    placar,
    round,
    ...(latest ? [latest] : []),
    // O estado do sorteio vai por último: só depois de todos os jogos sortearem.
    { name: "jogos/sorteio.json", schema: drawStateFileSchema, data: draw.toFile() },
  ];
}
