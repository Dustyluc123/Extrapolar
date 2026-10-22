// Dados do Dle de cada estado como arquivo estático (/jogos/dados/dle-SP.json), baixado pela
// ilha só quando o jogador escolhe o estado (ADR 0021).
import type { APIRoute, GetStaticPaths } from "astro";
import { dleStates } from "../../../lib/games/dle";

export const getStaticPaths = (() =>
  dleStates.map((file) => ({
    params: { uf: file.state },
    props: { file },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.file), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
