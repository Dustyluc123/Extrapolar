// Jogos 3 e 4: rodada da semana e votação mais recente (lidas e validadas no build).
import {
  latestVoteFileSchema,
  parseOrThrow,
  voteRoundFileSchema,
  type LatestVoteFile,
  type VoteRoundFile,
} from "@extrapolar/shared";
import rawRound from "../../../../../data/generated/jogos/vote-voce.json";

export const voteRound: VoteRoundFile = parseOrThrow(
  voteRoundFileSchema,
  rawRound,
  "data/generated/jogos/vote-voce.json",
);

const rawLatest = import.meta.glob("../../../../../data/generated/jogos/seja-deputado.json", {
  eager: true,
  import: "default",
});

/** Null se ainda não houver votação elegível (arquivo ausente). */
export const latestVote: LatestVoteFile | null = Object.values(rawLatest)[0]
  ? parseOrThrow(
      latestVoteFileSchema,
      Object.values(rawLatest)[0],
      "data/generated/jogos/seja-deputado.json",
    )
  : null;
