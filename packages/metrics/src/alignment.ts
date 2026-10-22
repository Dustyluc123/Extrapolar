// Alinhamento com uma orientação de bancada (do partido ou do Governo): função pura.
// Conta só votações em que o deputado votou Sim, Não, Abstenção ou Obstrução e a bancada
// orientou um desses mesmos valores. "Liberado", orientação vazia, orientação só de bloco
// (ADR 0014), Artigo 17 e voto secreto ficam fora — e são contados à parte, para a ficha mostrar.
import type { BallotValue } from "./participation";
import { safeRatio } from "./ratio";

/** Orientação já resolvida para o deputado naquela votação. */
export type ResolvedOrientation =
  | { kind: "value"; value: "yes" | "no" | "abstention" | "obstruction" }
  | { kind: "free" } // "Liberado"
  | { kind: "none" } // a bancada não orientou (ou orientação vazia)
  | { kind: "bloc-only" }; // só houve orientação de bloco, que não dá para atribuir ao partido

export interface AlignmentEntry {
  ballot: BallotValue;
  orientation: ResolvedOrientation;
}

export interface AlignmentResult {
  /** Votações comparáveis (voto e orientação entre Sim/Não/Abstenção/Obstrução). */
  comparableVotes: number;
  alignedVotes: number;
  rate: number | null;
  excluded: {
    /** Bancada liberou o voto. */
    free: number;
    /** Bancada não orientou. */
    noOrientation: number;
    /** Só havia orientação de bloco. */
    blocOnly: number;
    /** Voto do deputado foi Artigo 17 ou secreto. */
    ballotNotComparable: number;
  };
}

const COMPARABLE: ReadonlySet<BallotValue> = new Set(["yes", "no", "abstention", "obstruction"]);

export function computeAlignment(entries: readonly AlignmentEntry[]): AlignmentResult {
  const excluded = { free: 0, noOrientation: 0, blocOnly: 0, ballotNotComparable: 0 };
  let comparableVotes = 0;
  let alignedVotes = 0;
  for (const { ballot, orientation } of entries) {
    if (!COMPARABLE.has(ballot)) {
      excluded.ballotNotComparable++;
      continue;
    }
    if (orientation.kind === "free") {
      excluded.free++;
      continue;
    }
    if (orientation.kind === "none") {
      excluded.noOrientation++;
      continue;
    }
    if (orientation.kind === "bloc-only") {
      excluded.blocOnly++;
      continue;
    }
    comparableVotes++;
    if (orientation.value === ballot) alignedVotes++;
  }
  return {
    comparableVotes,
    alignedVotes,
    rate: safeRatio(alignedVotes, comparableVotes),
    excluded,
  };
}
