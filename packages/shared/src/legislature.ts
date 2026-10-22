// Legislaturas conhecidas e a legislatura atual.
// Trocar de legislatura = mudar CURRENT_LEGISLATURE_ID (a 58ª já está cadastrada).
// Datas conferidas em https://dadosabertos.camara.leg.br/api/v2/legislaturas/{id} (22/10/2026).

export interface Legislature {
  /** Número da legislatura (ex.: 57). */
  id: number;
  /** Primeiro dia, no formato AAAA-MM-DD. */
  start: string;
  /** Último dia, no formato AAAA-MM-DD. */
  end: string;
}

export const LEGISLATURES = {
  57: { id: 57, start: "2023-02-01", end: "2027-01-31" },
  58: { id: 58, start: "2027-02-01", end: "2031-01-31" },
} as const satisfies Record<number, Legislature>;

export type LegislatureId = keyof typeof LEGISLATURES;

/** Legislatura usada pelo pipeline e pelo site. */
export const CURRENT_LEGISLATURE_ID: LegislatureId = 57;

export function getLegislature(id: LegislatureId = CURRENT_LEGISLATURE_ID): Legislature {
  return LEGISLATURES[id];
}

/** Início da legislatura como data e hora local (AAAA-MM-DDTHH:mm:ss). */
export function legislatureStartDateTime(legislature: Legislature): string {
  return `${legislature.start}T00:00:00`;
}

/** Fim da legislatura como data e hora local (AAAA-MM-DDTHH:mm:ss). */
export function legislatureEndDateTime(legislature: Legislature): string {
  return `${legislature.end}T23:59:59`;
}

/** Anos civis cobertos pela legislatura, até o ano de `until` (AAAA-MM-DD...) se ele vier antes do fim. */
export function legislatureYears(legislature: Legislature, until?: string): number[] {
  const first = Number(legislature.start.slice(0, 4));
  const lastByLegislature = Number(legislature.end.slice(0, 4));
  const lastByDate = until ? Number(until.slice(0, 4)) : lastByLegislature;
  const last = Math.min(lastByLegislature, lastByDate);
  const years: number[] = [];
  for (let year = first; year <= last; year++) years.push(year);
  return years;
}
