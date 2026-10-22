// Voz (Caderno 5): resumo dos discursos do deputado. Função pura.
export interface Discourse {
  /** AAAA-MM-DDTHH:mm */
  date: string;
  phase: string | null;
  type: string;
}

export interface DiscoursesSummary {
  total: number;
  byYear: { year: number; count: number }[];
  byPhase: { phase: string; count: number }[];
  byType: { type: string; count: number }[];
  /** Data e hora do discurso mais recente (AAAA-MM-DDTHH:mm), ou null. */
  last: string | null;
}

const NO_PHASE = "Fase não informada";

function countBy<T>(items: readonly T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function summarizeDiscourses(
  discourses: readonly Discourse[],
  years: readonly number[],
  /** Só discursos a partir desta data (AAAA-MM-DD), ex.: início da legislatura. */
  from: string,
): DiscoursesSummary {
  const list = discourses
    .filter((d) => d.date.slice(0, 10) >= from)
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    total: list.length,
    byYear: years.map((year) => ({
      year,
      count: list.filter((d) => Number(d.date.slice(0, 4)) === year).length,
    })),
    byPhase: countBy(list, (d) => d.phase ?? NO_PHASE).map(({ name, count }) => ({
      phase: name,
      count,
    })),
    byType: countBy(list, (d) => d.type).map(({ name, count }) => ({ type: name, count })),
    last: list[0]?.date ?? null,
  };
}
