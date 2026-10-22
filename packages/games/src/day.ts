// Datas dos jogos. O dia vira à meia-noite de Brasília (sem horário de verão desde 2019).
// Nada aqui lê o relógio: o instante entra como argumento.

export const GAMES_TIME_ZONE = "America/Sao_Paulo";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Data AAAA-MM-DD de um instante no fuso de Brasília. */
export function brasiliaDateKey(now: Date, timeZone: string = GAMES_TIME_ZONE): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtcDays(dateKey: string): number {
  if (!DATE.test(dateKey)) throw new Error(`Data inválida: ${dateKey}`);
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** Dias entre duas datas AAAA-MM-DD (b − a). */
export function daysBetween(a: string, b: string): number {
  return toUtcDays(b) - toUtcDays(a);
}

/** Soma dias a uma data AAAA-MM-DD. */
export function addDays(dateKey: string, days: number): string {
  return new Date((toUtcDays(dateKey) + days) * 86_400_000).toISOString().slice(0, 10);
}

/** Segunda-feira da semana de uma data (as rodadas semanais trocam na segunda). */
export function weekStart(dateKey: string): string {
  const weekday = new Date(toUtcDays(dateKey) * 86_400_000).getUTCDay(); // 0 = domingo
  return addDays(dateKey, -((weekday + 6) % 7));
}

/** Número do desafio (#1 no dia do lançamento). Antes do lançamento, vale o #1. */
export function dailyNumber(dateKey: string, launchDate: string): number {
  return Math.max(0, daysBetween(launchDate, dateKey)) + 1;
}

/** Milissegundos até a próxima meia-noite de Brasília. */
export function msUntilNextDay(now: Date, timeZone: string = GAMES_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000;
  return 86_400_000 - elapsed - now.getMilliseconds();
}
