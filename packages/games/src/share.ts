// Textos de "compartilhar resultado", no estilo do Wordle: quadradinhos, sem revelar a resposta.
import type { AttributeFeedback, FeedbackStatus } from "./compare";

const SQUARE: Record<FeedbackStatus, string> = {
  hit: "🟩",
  near: "🟨",
  miss: "🟥",
  unknown: "⬜",
};

/**
 *   Extrapolar · Dle SP #12
 *   Acertei em 3 de 10 chutes
 *   🟥🟨🟥🟥🟨🟥🟥
 *   🟩🟩🟩🟩🟩🟩🟩
 *   https://…/jogos/dle
 */
export function dleShareText(input: {
  number: number;
  state: string;
  rows: readonly (readonly AttributeFeedback[])[];
  won: boolean;
  maxGuesses: number;
  url: string;
}): string {
  const count = input.rows.length;
  const headline = input.won
    ? `Acertei em ${count} de ${input.maxGuesses} ${input.maxGuesses === 1 ? "chute" : "chutes"}`
    : `Não acertei em ${input.maxGuesses} chutes`;
  return [
    `Extrapolar · Dle ${input.state} #${input.number}`,
    headline,
    ...input.rows.map((row) => row.map((item) => SQUARE[item.status]).join("")),
    input.url,
  ].join("\n");
}

/** Barra de 10 blocos para uma pontuação de 0 a 100. */
export function scoreBar(points: number, max = 100): string {
  const filled = Math.round((Math.max(0, Math.min(points, max)) / max) * 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

export function placarShareText(input: {
  number: number;
  stateCorrect: boolean;
  scorePoints: number;
  url: string;
}): string {
  return [
    `Extrapolar · Placar #${input.number}`,
    `Maioria do meu estado: ${input.stateCorrect ? "✅" : "❌"}`,
    `Placar: ${scoreBar(input.scorePoints)} ${input.scorePoints}/100`,
    input.url,
  ].join("\n");
}

/** Jogo 3: só quantas votou e quantas pulou; nunca os votos nem os deputados. */
export function voteRoundShareText(input: {
  week: string;
  voted: number;
  skipped: number;
  url: string;
}): string {
  return [
    `Extrapolar · Vote você também (semana de ${input.week})`,
    `Votei em ${input.voted} de ${input.voted + input.skipped} votações da Câmara`,
    "🗳️".repeat(input.voted) + "⬜".repeat(input.skipped),
    input.url,
  ].join("\n");
}

/** Jogo 4: sem o voto do jogador. */
export function beDeputyShareText(input: { date: string; url: string }): string {
  return [
    `Extrapolar · Seja deputado`,
    `Votei na votação de ${input.date} e conferi como a Câmara votou`,
    "🗳️",
    input.url,
  ].join("\n");
}
