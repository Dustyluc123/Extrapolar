// A mesa de votação: mata-borrão com os papéis do jogo por cima (docs/DESIGN.md, "Mesa de votação").
// No celular, a mesa ocupa a largura da tela; no computador, os papéis ficam à esquerda e os
// carimbos e o crachá à direita.
import type { ReactNode } from "react";
import { SoundToggle } from "./SoundToggle";

export function Desk({
  label,
  aside,
  children,
}: {
  /** Rótulo curto no alto da mesa ("Mesa de votação · Seja deputado"). */
  label: string;
  /** Coluna lateral (carimbos, crachá). No celular, vem depois dos papéis. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="desk">
      <div className="desk-bar">
        <p className="desk-label">{label}</p>
        <SoundToggle />
      </div>
      <div className={aside ? "desk-grid" : undefined}>
        <div className="desk-main">{children}</div>
        {aside ? <div className="desk-aside">{aside}</div> : null}
      </div>
    </div>
  );
}

/** Texto escrito direto na mesa (claro sobre o feltro). */
export function DeskNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`desk-note ${className}`}>{children}</p>;
}
