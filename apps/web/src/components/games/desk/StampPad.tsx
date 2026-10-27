// Os dois carimbos de voto, SIM e NÃO: botões de verdade (toque, clique ou teclado), sem arrastar.
// Mesmo desenho, mesma cor e mesmo som para os dois.
import type { ReactNode } from "react";
import type { PlayerChoice } from "@extrapolar/games";
import { playSound } from "../../../lib/games/sound";

export function StampPad({
  prompt,
  onStamp,
  children,
}: {
  prompt: ReactNode;
  onStamp: (choice: PlayerChoice) => void;
  /** Ações extras abaixo dos carimbos (ex.: "Separar para depois"). */
  children?: ReactNode;
}) {
  return (
    <div className="stamp-pad" role="group" aria-label="Carimbos de voto">
      <p className="stamp-pad-prompt">{prompt}</p>
      <div className="stamp-pad-row">
        {(["yes", "no"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            className="rubber-stamp"
            onClick={() => {
              playSound("stamp");
              onStamp(choice);
            }}
          >
            <span className="rubber-stamp-handle" aria-hidden="true" />
            <span className="rubber-stamp-face">
              <span className="visually-hidden">Carimbar </span>
              {choice === "yes" ? "Sim" : "Não"}
            </span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
