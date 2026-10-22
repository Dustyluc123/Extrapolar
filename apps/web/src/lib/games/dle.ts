// Dle do seu estado: dados de cada estado, lidos e validados no build.
import { dleStateFileSchema, parseOrThrow, type DleStateFile } from "@extrapolar/shared";

const raw = import.meta.glob("../../../../../data/generated/jogos/dle/*.json", {
  eager: true,
  import: "default",
});

export const dleStates: DleStateFile[] = Object.entries(raw)
  .map(([path, data]) => parseOrThrow(dleStateFileSchema, data, path))
  .sort((a, b) => a.state.localeCompare(b.state));
