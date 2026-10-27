// Painel do plenário: 513 luzes com o placar oficial da votação. Sim em tinta cheia, Não
// hachurado, outros votos vazados e os assentos restantes apagados ("sem voto registrado").
// Nunca verde × vermelho: o painel mostra contagens, não acerto. As luzes acendem em ondas
// (só sem prefers-reduced-motion); os números escritos vêm junto, para quem não vê o desenho.
import type { CSSProperties } from "react";
import { formatInt } from "../common";

/** Cadeiras da Câmara dos Deputados (art. 1º da Lei Complementar 78/1993). */
export const SEATS = 513;

type Light = "yes" | "no" | "other" | "none";

export function PlenaryPanel({
  yes,
  no,
  others,
  lit = true,
}: {
  yes: number;
  no: number;
  others: number;
  /** false antes da revelação: painel apagado. */
  lit?: boolean;
}) {
  const voted = yes + no + others;
  const none = Math.max(0, SEATS - voted);
  const lights: Light[] = [
    ...Array<Light>(yes).fill("yes"),
    ...Array<Light>(no).fill("no"),
    ...Array<Light>(others).fill("other"),
    ...Array<Light>(none).fill("none"),
  ].slice(0, Math.max(SEATS, voted));
  const legend: [Light, string, number][] = [
    ["yes", "Sim", yes],
    ["no", "Não", no],
    ["other", "Outros votos", others],
    ["none", "Sem voto registrado", none],
  ];
  return (
    <figure className="panel m-0" aria-labelledby="painel-legenda">
      <div className={`panel-board${lit ? " panel-lit" : ""}`} aria-hidden="true">
        {lights.map((light, i) => (
          <span
            key={i}
            className={`panel-light panel-${lit ? light : "none"}`}
            style={{ "--i": Math.floor(i / 32) } as CSSProperties}
          />
        ))}
      </div>
      <figcaption id="painel-legenda" className="panel-legend">
        <span className="visually-hidden">Painel do plenário: </span>
        {legend.map(([light, label, value]) => (
          <span key={light} className="panel-legend-item">
            <span className={`panel-light panel-${light}`} aria-hidden="true" />
            {label} <strong>{formatInt(value)}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
