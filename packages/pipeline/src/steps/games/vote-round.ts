// Jogos 3 e 4: rodada semanal de 10 votações e a votação mais recente, com votos e orientações.
import {
  GAMES_SCHEMA_VERSION,
  latestVoteFileSchema,
  voteRoundFileSchema,
  type CamaraOrientation,
  type GameDeputiesFile,
  type GameVote,
  type LatestVoteFile,
  type PartyOrientation,
  type VoteRoundFile,
} from "@extrapolar/shared";
import type { ResolvedOrientation } from "@extrapolar/metrics";
import { weekStart } from "@extrapolar/games";
import { resolvePartyOrientation } from "../../normalize/orientations";
import type { Federation } from "../../sources/camara-api";
import type { OutputFile } from "../publish";
import { encodeBallots, type Catalog } from "./catalog";

export const ROUND_SIZE = 10;
/** Quase unânime: o lado menor teve menos de 10% dos votos Sim + Não (decidido no planejamento). */
export const NEAR_UNANIMOUS_SHARE = 0.1;

export function isNearUnanimous(vote: Pick<GameVote, "official">): boolean {
  const { yes, no } = vote.official;
  const total = yes + no;
  return total === 0 || Math.min(yes, no) / total < NEAR_UNANIMOUS_SHARE;
}

/**
 * As votações da rodada: as 10 elegíveis mais recentes registradas **antes** da segunda-feira da
 * semana (a rodada não muda no meio da semana), uma por proposição (a mais recente de cada) e
 * sem as quase unânimes. `votes` vem da mais antiga para a mais recente.
 */
export function selectRound(votes: readonly GameVote[], week: string): GameVote[] {
  const seen = new Set<number>();
  const picked: GameVote[] = [];
  for (let i = votes.length - 1; i >= 0 && picked.length < ROUND_SIZE; i--) {
    const vote = votes[i]!;
    if (vote.date >= week) continue;
    if (seen.has(vote.proposition.id)) continue;
    seen.add(vote.proposition.id);
    if (isNearUnanimous(vote)) continue;
    picked.push(vote);
  }
  return picked.reverse();
}

const ORIENTATION_CHAR: Record<string, string> = {
  yes: "S",
  no: "N",
  abstention: "A",
  obstruction: "O",
};

export function orientationChar(orientation: ResolvedOrientation): string {
  switch (orientation.kind) {
    case "value":
      return ORIENTATION_CHAR[orientation.value]!;
    case "free":
      return "L";
    case "bloc-only":
      return "B";
    case "none":
      return "-";
  }
}

/** Orientação de cada partido (com deputado em exercício) em cada votação (ADR 0014). */
export function partyOrientations(input: {
  voteIds: readonly string[];
  parties: readonly string[];
  orientationsByVote: ReadonlyMap<string, CamaraOrientation[]>;
  federations: readonly Federation[];
}): PartyOrientation[] {
  return [...input.parties].sort().map((party) => {
    let orientations = "";
    let viaFederation = "";
    for (const voteId of input.voteIds) {
      const resolved = resolvePartyOrientation(
        input.orientationsByVote.get(voteId),
        party,
        input.federations,
      );
      orientations += orientationChar(resolved.orientation);
      viaFederation += resolved.fromFederation ? "1" : "0";
    }
    return { party, orientations, viaFederation };
  });
}

export function buildVoteRound(input: {
  catalog: Catalog;
  deputies: GameDeputiesFile;
  orientationsByVote: ReadonlyMap<string, CamaraOrientation[]>;
  federations: readonly Federation[];
  today: string;
}): OutputFile {
  const week = weekStart(input.today);
  const votes = selectRound(input.catalog.file.votes, week);
  const parties = [...new Set(input.deputies.deputies.map((d) => d.party))];
  const file: VoteRoundFile = {
    schemaVersion: GAMES_SCHEMA_VERSION,
    week,
    votes,
    ballots: votes.map((v) =>
      encodeBallots(input.deputies.deputies, input.catalog.ballotsByVote.get(v.id)),
    ),
    parties: partyOrientations({
      voteIds: votes.map((v) => v.id),
      parties,
      orientationsByVote: input.orientationsByVote,
      federations: input.federations,
    }),
  };
  return { name: "jogos/vote-voce.json", schema: voteRoundFileSchema, data: file };
}

/** A votação elegível mais recente (pelo horário de registro). Null se não houver nenhuma. */
export function buildLatestVote(input: {
  catalog: Catalog;
  deputies: GameDeputiesFile;
  orientationsByVote: ReadonlyMap<string, CamaraOrientation[]>;
  federations: readonly Federation[];
}): OutputFile | null {
  const vote = input.catalog.file.votes.at(-1);
  if (!vote) return null;
  const partyAt = input.catalog.partyByVote.get(vote.id);
  const parties = [...new Set(input.deputies.deputies.map((d) => d.party))];
  const file: LatestVoteFile = {
    schemaVersion: GAMES_SCHEMA_VERSION,
    vote,
    ballots: encodeBallots(input.deputies.deputies, input.catalog.ballotsByVote.get(vote.id)),
    partiesAtVote: input.deputies.deputies.map((d) => partyAt?.get(d.id) ?? ""),
    parties: partyOrientations({
      voteIds: [vote.id],
      parties,
      orientationsByVote: input.orientationsByVote,
      federations: input.federations,
    }),
  };
  return { name: "jogos/seja-deputado.json", schema: latestVoteFileSchema, data: file };
}
