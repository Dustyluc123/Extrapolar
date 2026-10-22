// Jogo 2 — Placar: dias sorteados (lidos e validados no build).
import { parseOrThrow, placarFileSchema, type PlacarFile } from "@extrapolar/shared";
import raw from "../../../../../data/generated/jogos/placar.json";

export const placar: PlacarFile = parseOrThrow(
  placarFileSchema,
  raw,
  "data/generated/jogos/placar.json",
);
