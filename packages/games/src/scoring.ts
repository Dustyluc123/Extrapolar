// Pontuação e concordância dos jogos 2, 3 e 4.

export type PlayerChoice = "yes" | "no";
/** Voto registrado de um deputado, como no arquivo oficial (ADR 0007). */
export type BallotCode = "yes" | "no" | "abstention" | "obstruction" | "article17";

/** Porcentagem de Sim entre os votos Sim + Não (0 a 100), ou null sem votos Sim/Não. */
export function yesShare(yes: number, no: number): number | null {
  const total = yes + no;
  return total > 0 ? (yes / total) * 100 : null;
}

/**
 * Pontos do placar (Jogo 2): 100 − 2 × diferença em pontos percentuais, sem passar de 0.
 * Acertar em cheio vale 100; errar por 10 pontos vale 80; por 50 ou mais, 0.
 */
export function placarScore(guessPercent: number, actualPercent: number): number {
  const diff = Math.abs(guessPercent - actualPercent);
  return Math.max(0, Math.round(100 - 2 * diff));
}

export type StateMajority = "yes" | "no" | "tie" | "none";

/**
 * Como votou a maioria dos deputados de um estado (Jogo 2): compara só Sim e Não.
 * Empate e "nenhum voto Sim/Não" são respostas possíveis e aparecem como tais.
 */
export function stateMajority(ballots: readonly (BallotCode | null)[]): StateMajority {
  let yes = 0;
  let no = 0;
  for (const ballot of ballots) {
    if (ballot === "yes") yes++;
    else if (ballot === "no") no++;
  }
  if (yes === 0 && no === 0) return "none";
  if (yes === no) return "tie";
  return yes > no ? "yes" : "no";
}

/** Pontos da pergunta do estado (Jogo 2): acerto vale 50; o placar vale até 100. */
export const STATE_QUESTION_POINTS = 50;

export interface AgreementResult {
  /** Votações em que o jogador e o deputado votaram Sim ou Não. */
  compared: number;
  /** Delas, quantas com o mesmo voto. */
  agreed: number;
  /** Votações da rodada em que o deputado registrou outro voto (abstenção, obstrução, Art. 17). */
  otherBallots: number;
  /** Concordância (agreed ÷ compared), ou null sem base. */
  rate: number | null;
  /** Base pequena: menos de SMALL_BASE votações comparadas. */
  smallBase: boolean;
}

/** Menos que isso de votações comparadas = aviso de base pequena (Jogo 3). */
export const AGREEMENT_SMALL_BASE = 5;

/**
 * Concordância entre o jogador e um deputado (ou a orientação de um partido) — Jogo 3.
 * Conta só as votações em que os dois votaram Sim ou Não. Pulos do jogador não contam;
 * abstenção, obstrução e Art. 17 do deputado ficam à parte, sem contar a favor nem contra.
 */
export function agreement(
  player: Readonly<Record<string, PlayerChoice | null>>,
  other: Readonly<Record<string, BallotCode | null>>,
): AgreementResult {
  let compared = 0;
  let agreed = 0;
  let otherBallots = 0;
  for (const [voteId, choice] of Object.entries(player)) {
    if (choice === null) continue;
    const ballot = other[voteId] ?? null;
    if (ballot === null) continue;
    if (ballot !== "yes" && ballot !== "no") {
      otherBallots++;
      continue;
    }
    compared++;
    if (ballot === choice) agreed++;
  }
  return {
    compared,
    agreed,
    otherBallots,
    rate: compared > 0 ? agreed / compared : null,
    smallBase: compared < AGREEMENT_SMALL_BASE,
  };
}

/** Voto compacto (um caractere, como em jogos/deputados.json) → voto. "-" = sem voto registrado. */
export function decodeBallot(char: string | undefined): BallotCode | null {
  switch (char) {
    case "S":
      return "yes";
    case "N":
      return "no";
    case "A":
      return "abstention";
    case "O":
      return "obstruction";
    case "P":
      return "article17";
    default:
      return null;
  }
}

/**
 * Votos Sim exigidos pela Constituição para aprovar, pelo tipo da proposição: lei complementar
 * precisa de maioria absoluta (257 de 513) e PEC de três quintos (308), em cada turno.
 * Null = maioria simples dos presentes (a regra geral).
 */
export function requiredYesVotes(propositionLabel: string): number | null {
  const type = propositionLabel.split(" ")[0]?.toUpperCase();
  if (type === "PLP") return 257;
  if (type === "PEC") return 308;
  return null;
}
