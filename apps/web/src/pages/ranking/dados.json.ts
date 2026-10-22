// Dados compactos do "Monte seu ranking" (/ranking/dados.json), gerados no build.
import type { APIRoute } from "astro";
import { buildRankingData } from "../../lib/ranking";

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await buildRankingData()), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
