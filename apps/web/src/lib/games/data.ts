// Dados dos jogos lidos no build (data/generated/jogos), validados com Zod.
// Arquivo ausente ou inválido quebra o build, como no resto do site.
import {
  gameDeputiesFileSchema,
  gameVotesFileSchema,
  parseOrThrow,
  type GameDeputiesFile,
  type GameVote,
  type GameVotesFile,
} from "@extrapolar/shared";
import rawVotes from "../../../../../data/generated/jogos/votacoes.json";
import rawDeputies from "../../../../../data/generated/jogos/deputados.json";

export const gameVotes: GameVotesFile = parseOrThrow(
  gameVotesFileSchema,
  rawVotes,
  "data/generated/jogos/votacoes.json",
);

export const gameDeputies: GameDeputiesFile = parseOrThrow(
  gameDeputiesFileSchema,
  rawDeputies,
  "data/generated/jogos/deputados.json",
);

/** Página oficial da proposição na Câmara (com a aba de votações). */
export function propositionUrl(id: number): string {
  return `https://www.camara.leg.br/propostas-legislativas/${id}`;
}

/** Dado bruto da votação na API de Dados Abertos. */
export function voteDataUrl(voteId: string): string {
  return `https://dadosabertos.camara.leg.br/api/v2/votacoes/${voteId}`;
}

/** Texto a mostrar: o resumo revisado, se houver; senão, a ementa oficial. */
export function voteText(vote: GameVote): { text: string; isPlain: boolean } {
  return vote.plainSummary
    ? { text: vote.plainSummary, isPlain: true }
    : { text: vote.proposition.summary, isPlain: false };
}
