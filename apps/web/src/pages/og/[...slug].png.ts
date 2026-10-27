// Imagens de prévia (Open Graph), 1200 × 630, PNG, geradas no build (ADR 0023):
// /og/extrapolar.png (geral), /og/jogos.png, /og/jogos/<jogo>.png, /og/ranking.png e
// /og/deputados/<id>.png. Não vão para o Git: saem em apps/web/dist a cada build.
import type { APIRoute, GetStaticPaths } from "astro";
import type { Deputy } from "@extrapolar/shared";
import { repository } from "../../lib/data";
import { STATIC_CARDS, type StaticCard } from "../../lib/og/cards";
import { renderDeputyCard, renderStaticCard } from "../../lib/og";
import { prefetchPhotos } from "../../lib/og/photos";

type Props = { card: StaticCard } | { deputy: Deputy };

export const getStaticPaths = (async () => {
  const deputies = await repository.listDeputies();
  return [
    ...STATIC_CARDS.map((card) => ({ params: { slug: card.slug }, props: { card } })),
    ...deputies.map((deputy) => ({
      params: { slug: `deputados/${deputy.id}` },
      props: { deputy },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) => {
  let png: Buffer;
  if ("card" in props) {
    png = await renderStaticCard(props.card);
  } else {
    prefetchPhotos(await repository.listDeputies());
    png = await renderDeputyCard(props.deputy);
  }
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
