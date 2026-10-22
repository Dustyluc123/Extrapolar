// Jogo 2 — Placar: uma votação elegível dos últimos 12 meses por dia.
import {
  GAMES_SCHEMA_VERSION,
  placarDaySchema,
  placarFileSchema,
  parseOrThrow,
  type GameDeputiesFile,
  type PlacarDay,
  type PlacarFile,
} from "@extrapolar/shared";
import { addDays } from "@extrapolar/games";
import type { OutputFile } from "../publish";
import { encodeBallots, type Catalog } from "./catalog";
import { makeRank, type DrawState } from "./draw";

/** Janela do sorteio: votações dos últimos 12 meses (as mais "recentes"). */
export const PLACAR_WINDOW_DAYS = 365;

export function buildPlacar(input: {
  catalog: Catalog;
  deputies: GameDeputiesFile;
  today: string;
  draw: DrawState;
  secret: string;
}): OutputFile {
  const from = addDays(input.today, -PLACAR_WINDOW_DAYS);
  const pool = input.catalog.file.votes.filter((v) => v.date >= from);
  const byId = new Map(pool.map((v) => [v.id, v]));
  const days = input.draw.draw({
    key: "placar",
    ids: pool.map((v) => v.id),
    today: input.today,
    rank: makeRank(input.secret, "placar"),
    payload: (id): PlacarDay =>
      parseOrThrow(
        placarDaySchema,
        {
          vote: byId.get(id),
          ballots: encodeBallots(input.deputies.deputies, input.catalog.ballotsByVote.get(id)),
        },
        `jogos/placar.json (${id})`,
      ),
  });
  const file: PlacarFile = { schemaVersion: GAMES_SCHEMA_VERSION, poolSize: pool.length, days };
  return { name: "jogos/placar.json", schema: placarFileSchema, data: file };
}
