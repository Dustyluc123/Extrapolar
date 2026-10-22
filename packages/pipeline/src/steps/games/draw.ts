// Sorteio diário dos jogos num site estático (ADR 0020).
// O pipeline sorteia hoje e os próximos dias com HMAC e a chave secreta EXTRAPOLAR_DAILY_SECRET
// (segredo do GitHub Actions). O estado do sorteio (listas que só crescem) fica em
// data/generated/jogos/sorteio.json, para os dias já sorteados nunca mudarem.
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  GAMES_SCHEMA_VERSION,
  drawStateFileSchema,
  type DrawStateFile,
  type DrawnDay,
} from "@extrapolar/shared";
import {
  addDays,
  dailyNumber,
  dailyPick,
  scramble,
  updateRoster,
  type RosterEntry,
} from "@extrapolar/games";
import { log } from "../../lib/log";

/** Dias sorteados além de hoje: folga se uma execução diária falhar. */
export const DAYS_AHEAD = 3;

/** Chave usada sem o segredo (desenvolvimento local). Quem ler o código consegue prever os dias. */
const LOCAL_SECRET = "extrapolar-local-sem-segredo";

export function drawSecret(): string {
  const secret = process.env.EXTRAPOLAR_DAILY_SECRET;
  if (secret && secret.length >= 16) return secret;
  log.warn(
    "EXTRAPOLAR_DAILY_SECRET ausente (ou com menos de 16 caracteres): sorteio com a chave local, previsível por quem ler o código.",
  );
  return LOCAL_SECRET;
}

/** Ordem secreta de um item num ciclo de um jogo. */
export function makeRank(secret: string, game: string): (cycle: number, id: string) => string {
  return (cycle, id) => createHmac("sha256", secret).update(`${game}:${cycle}:${id}`).digest("hex");
}

export async function loadDrawState(generatedDir: string): Promise<DrawStateFile | null> {
  try {
    const raw = JSON.parse(await readFile(join(generatedDir, "jogos", "sorteio.json"), "utf8"));
    const parsed = drawStateFileSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    throw new Error(
      "data/generated/jogos/sorteio.json existe mas está num formato inesperado; confira antes de publicar (os dias já sorteados mudariam).",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export class DrawState {
  readonly launchDate: string;
  private readonly rosters: Map<string, RosterEntry[]>;

  constructor(previous: DrawStateFile | null, today: string) {
    this.launchDate = previous?.launchDate ?? today;
    this.rosters = new Map(Object.entries(previous?.rosters ?? {}));
  }

  /**
   * Atualiza a lista de um jogo com os ids atuais e sorteia hoje e os próximos dias.
   * Itens novos entram com a data de hoje (só aparecem no próximo ciclo); o primeiro roster de
   * um jogo começa no lançamento.
   */
  draw<T>(input: {
    key: string;
    ids: readonly string[];
    today: string;
    rank: (cycle: number, id: string) => string;
    payload: (id: string) => T;
  }): DrawnDay[] {
    const current = this.rosters.get(input.key) ?? [];
    const since = current.length === 0 ? this.launchDate : input.today;
    const roster = updateRoster(current, input.ids, since);
    this.rosters.set(input.key, roster);
    const available = new Set(input.ids);
    const days: DrawnDay[] = [];
    for (let offset = 0; offset <= DAYS_AHEAD; offset++) {
      const date = addDays(input.today, offset);
      const id = dailyPick({ dateKey: date, roster, rank: input.rank, available });
      if (id === null) continue;
      days.push({
        date,
        number: dailyNumber(date, this.launchDate),
        data: scramble(JSON.stringify(input.payload(id)), date),
      });
    }
    return days;
  }

  toFile(): DrawStateFile {
    return {
      schemaVersion: GAMES_SCHEMA_VERSION,
      launchDate: this.launchDate,
      rosters: Object.fromEntries(
        [...this.rosters.entries()].sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
  }
}
