// "Monte seu ranking" (Fase 2): normalização em percentil e nota com os critérios do usuário.
// O site nunca escolhe métricas, pesos ou direções (ADR 0010). Fórmulas em docs/METODOLOGIA.md.

/** O usuário diz se, para ele, um valor maior ou menor deve subir na lista. */
export type RankingDirection = "more" | "less";

export interface RankingCriterion {
  key: string;
  /** Peso de 0 a 5. Peso 0 = a métrica não entra na nota (nem exclui ninguém). */
  weight: number;
  direction: RankingDirection;
}

export const MAX_WEIGHT = 5;

/**
 * Percentil de cada valor entre os que têm dado, de 0 (menor) a 1 (maior).
 * Empates recebem a média das posições: p = (abaixo + (iguais − 1) ÷ 2) ÷ (n − 1).
 * Com um só valor (ou todos iguais), todos ficam em 0,5.
 */
export function percentiles(values: ReadonlyMap<number, number>): Map<number, number> {
  const sorted = [...values.values()].sort((a, b) => a - b);
  const n = sorted.length;
  const result = new Map<number, number>();
  if (n === 0) return result;
  // Para cada valor distinto: quantos estão abaixo e quantos são iguais.
  const stats = new Map<number, { below: number; equal: number }>();
  for (let i = 0; i < n;) {
    let j = i;
    while (j < n && sorted[j] === sorted[i]) j++;
    stats.set(sorted[i]!, { below: i, equal: j - i });
    i = j;
  }
  for (const [id, value] of values) {
    const { below, equal } = stats.get(value)!;
    result.set(id, n === 1 ? 0.5 : (below + (equal - 1) / 2) / (n - 1));
  }
  return result;
}

export interface RankedDeputy {
  id: number;
  /** Posição (1 = primeira); empates na nota dividem a posição (1, 2, 2, 4). */
  position: number;
  /** Nota de 0 a 100. */
  score: number;
  /** Quanto cada métrica somou à nota (pontos de 0 a 100, somando a nota). */
  contributions: { key: string; points: number; percentile: number }[];
}

export interface RankingResult {
  ranked: RankedDeputy[];
  /** Deputados sem dado em alguma métrica escolhida (com as métricas que faltaram). */
  excluded: { id: number; missing: string[] }[];
  /** Métricas que entraram na nota (peso > 0). */
  activeKeys: string[];
}

/**
 * Monta a classificação com os critérios do usuário.
 * - `values[key]` traz o valor de cada deputado com dado (sem dado = ausente do mapa, nunca 0).
 * - O percentil é calculado entre todos os deputados com dado na métrica (a Câmara inteira);
 *   `ids` diz quem aparece na lista (filtros de estado e partido).
 * - Nota = soma de peso × percentil ÷ soma dos pesos × 100. "Menos" usa 1 − percentil.
 */
export function buildRanking(input: {
  criteria: readonly RankingCriterion[];
  values: Readonly<Record<string, ReadonlyMap<number, number>>>;
  ids: readonly number[];
  /** Desempate estável na exibição (ex.: nome). Não muda a posição. */
  tieBreak?: (a: number, b: number) => number;
}): RankingResult {
  const active = input.criteria.filter((c) => c.weight > 0 && input.values[c.key] !== undefined);
  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  const result: RankingResult = { ranked: [], excluded: [], activeKeys: active.map((c) => c.key) };
  if (active.length === 0 || totalWeight === 0) return result;

  const pct = new Map(active.map((c) => [c.key, percentiles(input.values[c.key]!)]));
  const scored: Omit<RankedDeputy, "position">[] = [];
  for (const id of input.ids) {
    const missing = active.filter((c) => !pct.get(c.key)!.has(id)).map((c) => c.key);
    if (missing.length > 0) {
      result.excluded.push({ id, missing });
      continue;
    }
    const contributions = active.map((c) => {
      const raw = pct.get(c.key)!.get(id)!;
      const percentile = c.direction === "more" ? raw : 1 - raw;
      return { key: c.key, percentile, points: (c.weight * percentile * 100) / totalWeight };
    });
    const score = contributions.reduce((sum, c) => sum + c.points, 0);
    scored.push({ id, score, contributions });
  }

  // Arredonda para comparar (evita "empate" perdido por erro de ponto flutuante).
  const key = (score: number) => Math.round(score * 1e9);
  scored.sort(
    (a, b) => key(b.score) - key(a.score) || (input.tieBreak?.(a.id, b.id) ?? a.id - b.id),
  );
  let position = 0;
  scored.forEach((item, index) => {
    if (index === 0 || key(item.score) !== key(scored[index - 1]!.score)) position = index + 1;
    result.ranked.push({ ...item, position });
  });
  return result;
}

/** Critérios na URL: "participacao.3.mais,cota-total.2.menos". Entrada inválida é ignorada. */
export function parseCriteria(text: string, knownKeys: ReadonlySet<string>): RankingCriterion[] {
  const seen = new Set<string>();
  const criteria: RankingCriterion[] = [];
  for (const part of text.split(",")) {
    const match = /^([a-z0-9-]+)\.([0-5])\.(mais|menos)$/.exec(part.trim());
    if (!match) continue;
    const [, key, weight, direction] = match as unknown as [string, string, string, string];
    if (!knownKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    criteria.push({
      key,
      weight: Number(weight),
      direction: direction === "mais" ? "more" : "less",
    });
  }
  return criteria;
}

export function serializeCriteria(criteria: readonly RankingCriterion[]): string {
  return criteria
    .map((c) => `${c.key}.${c.weight}.${c.direction === "more" ? "mais" : "menos"}`)
    .join(",");
}

/** Filtros com vários valores na URL: "SP,RJ". Desconhecidos e repetidos são ignorados. */
export function parseFilterList(text: string, known: ReadonlySet<string>): string[] {
  const seen = new Set<string>();
  for (const part of text.split(",")) {
    const value = part.trim();
    if (value && known.has(value)) seen.add(value);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function serializeFilterList(values: readonly string[]): string {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR")).join(",");
}

/** Mediana; com quantidade par, a média dos dois do meio. Lista vazia = null (nunca 0). */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Abaixo disso, a comparação entre partidos avisa "base pequena": com menos de 10 deputados na
 * conta, um deputado a mais ou a menos mexe muito na mediana. Escolha de apresentação, não
 * estatística (docs/METODOLOGIA.md).
 */
export const GROUP_SMALL_BASE = 10;

export interface GroupSummary {
  group: string;
  /** Deputados do grupo que entraram na conta (têm dado em todas as métricas escolhidas). */
  included: number;
  /** Deputados do grupo que ficaram fora por "sem dado". */
  excluded: number;
  /** Mediana, menor e maior nota do grupo; null quando ninguém do grupo entrou na conta. */
  median: number | null;
  min: number | null;
  max: number | null;
  /** Menos de GROUP_SMALL_BASE deputados na conta (e ao menos um). */
  smallBase: boolean;
}

/**
 * Resumo da nota por grupo (ex.: partido), com os critérios de quem montou o ranking.
 * Os grupos saem em ordem alfabética, nunca pela mediana: o site não ordena partidos.
 * Grupo sem ninguém com dado aparece com mediana null, e não 0.
 */
export function summarizeGroups(input: {
  result: RankingResult;
  groups: readonly string[];
  groupOf: (id: number) => string | undefined;
  smallBase?: number;
}): GroupSummary[] {
  const limit = input.smallBase ?? GROUP_SMALL_BASE;
  const scores = new Map<string, number[]>();
  const excluded = new Map<string, number>();
  const wanted = new Set(input.groups);
  for (const row of input.result.ranked) {
    const group = input.groupOf(row.id);
    if (group === undefined || !wanted.has(group)) continue;
    scores.set(group, [...(scores.get(group) ?? []), row.score]);
  }
  for (const row of input.result.excluded) {
    const group = input.groupOf(row.id);
    if (group === undefined || !wanted.has(group)) continue;
    excluded.set(group, (excluded.get(group) ?? 0) + 1);
  }
  return [...wanted]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((group) => {
      const list = scores.get(group) ?? [];
      return {
        group,
        included: list.length,
        excluded: excluded.get(group) ?? 0,
        median: median(list),
        min: list.length > 0 ? Math.min(...list) : null,
        max: list.length > 0 ? Math.max(...list) : null,
        smallBase: list.length > 0 && list.length < limit,
      };
    });
}
