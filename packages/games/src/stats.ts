// Sequência de dias e estatísticas de um jogo diário (guardadas só no navegador do jogador).
import { addDays } from "./day";

export interface GameStats {
  played: number;
  /** Dias "completos": no Dle, acertou; no Placar, jogou até o fim. */
  completed: number;
  /** Dias seguidos completos, terminando no último dia jogado. */
  streak: number;
  maxStreak: number;
  /** Último dia registrado (AAAA-MM-DD). */
  lastDate: string | null;
  /** Distribuição livre (ex.: chutes usados no Dle, faixa de pontos no Placar). */
  distribution: Record<string, number>;
}

export const EMPTY_STATS: GameStats = {
  played: 0,
  completed: 0,
  streak: 0,
  maxStreak: 0,
  lastDate: null,
  distribution: {},
};

/**
 * Registra o resultado de um dia. Registrar duas vezes o mesmo dia não muda nada.
 * A sequência continua se o último dia completo foi ontem; um dia sem jogar ou incompleto zera.
 */
export function recordDay(
  stats: GameStats,
  dateKey: string,
  completed: boolean,
  bucket?: string,
): GameStats {
  if (stats.lastDate !== null && dateKey <= stats.lastDate) return stats;
  const continues = stats.lastDate === addDays(dateKey, -1) && stats.streak > 0;
  const streak = completed ? (continues ? stats.streak + 1 : 1) : 0;
  const distribution = { ...stats.distribution };
  if (bucket !== undefined) distribution[bucket] = (distribution[bucket] ?? 0) + 1;
  return {
    played: stats.played + 1,
    completed: stats.completed + (completed ? 1 : 0),
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastDate: dateKey,
    distribution,
  };
}

/** Sequência que vale hoje: se o último dia completo não foi hoje nem ontem, já acabou. */
export function currentStreak(stats: GameStats, today: string): number {
  if (stats.lastDate === null) return 0;
  if (stats.lastDate === today || stats.lastDate === addDays(today, -1)) return stats.streak;
  return 0;
}

/** Lê estatísticas salvas, aceitando só o formato esperado (dado estranho = começa do zero). */
export function parseStats(raw: unknown): GameStats {
  if (!raw || typeof raw !== "object") return EMPTY_STATS;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
  const distribution: Record<string, number> = {};
  if (r.distribution && typeof r.distribution === "object") {
    for (const [k, v] of Object.entries(r.distribution as Record<string, unknown>)) {
      distribution[k] = num(v);
    }
  }
  return {
    played: num(r.played),
    completed: num(r.completed),
    streak: num(r.streak),
    maxStreak: num(r.maxStreak),
    lastDate:
      typeof r.lastDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.lastDate) ? r.lastDate : null,
    distribution,
  };
}
