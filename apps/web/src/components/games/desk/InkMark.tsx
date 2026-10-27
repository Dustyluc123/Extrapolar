// Marca de tinta deixada pelo carimbo do jogador: levemente torta (fixa para cada documento).
// A mesma cor para SIM e NÃO: o carimbo registra a escolha, não a comenta.
import type { CSSProperties } from "react";
import type { PlayerChoice } from "@extrapolar/games";
import { inkTilt } from "../../../lib/games/tilt";

export function InkMark({
  choice,
  seed,
  caption,
  fresh = false,
}: {
  choice: PlayerChoice | "later";
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
  const word = choice === "yes" ? "Sim" : choice === "no" ? "Não" : "Para depois";
  return (
    <span className={`ink-mark${fresh ? " ink-press" : ""}`} style={style}>
      <span className="visually-hidden">Seu carimbo: </span>
      <span className={`ink-mark-word${choice === "later" ? " ink-mark-word-small" : ""}`}>
        {word}
      </span>
      {caption ? <span className="ink-mark-caption">{caption}</span> : null}
    </span>
  );
}
