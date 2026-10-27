// Imagens de prévia: qual imagem cada página usa e como gerar cada uma (ADR 0023).
import type { Deputy } from "@extrapolar/shared";
import { stateName } from "../states";
import { displayHost } from "../site";
import {
  DEFAULT_CARD_SLUG,
  DeputyCardImage,
  OG_COLORS,
  STATIC_CARDS,
  StaticCardImage,
  deputyAlt,
  type StaticCard,
} from "./cards";
import { halftoneSvg } from "./halftone";
import { grayGrid, photoFor } from "./photos";
import { OG_HEIGHT, OG_WIDTH, renderPng } from "./render";

export { OG_HEIGHT, OG_WIDTH };

export interface OgImage {
  /** Caminho no site (ex.: "/og/jogos/dle.png"). */
  path: string;
  alt: string;
}

const byslug = new Map(STATIC_CARDS.map((card) => [card.slug, card]));

export function staticCard(slug: string): StaticCard {
  const card = byslug.get(slug);
  if (!card) throw new Error(`Imagem de prévia "${slug}" não existe em lib/og/cards.tsx.`);
  return card;
}

export function staticOgImage(slug: string = DEFAULT_CARD_SLUG): OgImage {
  return { path: `/og/${slug}.png`, alt: staticCard(slug).alt };
}

export function deputyOgImage(deputy: Pick<Deputy, "id" | "name" | "party" | "state">): OgImage {
  return {
    path: `/og/deputados/${deputy.id}.png`,
    alt: deputyAlt({ ...deputy, stateName: stateName(deputy.state) }),
  };
}

export function renderStaticCard(card: StaticCard): Promise<Buffer> {
  return renderPng(<StaticCardImage card={card} host={displayHost()} />);
}

// Foto 3:4 (300 × 400 px) em células de 6 px: 50 × 67 pontos.
const CELL = 6;
const COLS = 50;
const ROWS = 67;

export async function renderDeputyCard(deputy: Deputy): Promise<Buffer> {
  const photo = await photoFor(deputy);
  let photoUri: string | null = null;
  if (photo) {
    const svg = halftoneSvg(await grayGrid(photo, COLS, ROWS), {
      cell: CELL,
      ink: OG_COLORS.ink,
      paper: OG_COLORS.paper,
      contrast: 1.15,
    });
    photoUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return renderPng(
    <DeputyCardImage
      deputy={{
        name: deputy.name,
        party: deputy.party,
        state: deputy.state,
        stateName: stateName(deputy.state),
        photo: photoUri,
      }}
      host={displayHost()}
    />,
  );
}
