// Marca de tinta deixada pelo carimbo do jogador: levemente torta (fixa para cada documento).
// A mesma cor para SIM e NÃO: o carimbo registra a escolha, não a comenta.
import type { CSSProperties } from "react";
import type { PlayerChoice } from "@extrapolar/games";
import { inkTilt } from "../../../lib/games/tilt";

export function InkMark({
  choice,
  word: customWord,
  seed,
  caption,
  fresh = false,
}: {
  choice?: PlayerChoice | "later";
  /** Palavra do carimbo quando não é um voto ("Conferido"). */
  word?: string;
  /** Id do documento: decide a inclinação. */
  seed: string;
  caption?: string;
  /** Acabou de carimbar: anima a batida (só sem prefers-reduced-motion). */
  fresh?: boolean;
}) {
  const tilt = inkTilt(seed);
  const style = {
    "--ink-angle": `${tilt.angle}deg`,
    "--ink-dx": `${tilt.dx}%`,
    "--ink-dy": `${tilt.dy}%`,
  } as CSSProperties;
  const word = customWord ?? (choice === "yes" ? "Sim" : choice === "no" ? "Não" : "Para depois");
  const small = choice === "later" || (customWord !== undefined && customWord.length > 4);
  return (
    <span className={`ink-mark${fresh ? " ink-press" : ""}`} style={style}>
      {customWord ? null : <span className="visually-hidden">Seu carimbo: </span>}
      <span className={`ink-mark-word${small ? " ink-mark-word-small" : ""}`}>{word}</span>
      {caption ? <span className="ink-mark-caption">{caption}</span> : null}
    </span>
  );
}
