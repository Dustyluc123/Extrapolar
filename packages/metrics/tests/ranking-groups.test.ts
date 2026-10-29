import { describe, expect, it } from "vitest";
import {
  GROUP_SMALL_BASE,
  buildRanking,
  median,
  parseFilterList,
  serializeFilterList,
  summarizeGroups,
  type RankingResult,
} from "../src/index";

describe("median", () => {
  it("quantidade ímpar: o valor do meio", () => {
    expect(median([30, 10, 20])).toBe(20);
  });

  it("quantidade par: média dos dois do meio", () => {
    expect(median([10, 40, 20, 30])).toBe(25);
  });

  it("empates: valores repetidos contam todos", () => {
    expect(median([50, 50, 50, 90])).toBe(50);
    expect(median([10, 50, 50])).toBe(50);
  });

  it("um valor só", () => {
    expect(median([42])).toBe(42);
  });

  it("lista vazia é null, nunca 0", () => {
    expect(median([])).toBeNull();
  });

  it("não altera a lista recebida", () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

/** Resultado montado à mão para controlar as notas. */
function result(ranked: [number, number][], excluded: number[] = []): RankingResult {
  return {
    ranked: ranked.map(([id, score], i) => ({ id, score, position: i + 1, contributions: [] })),
    excluded: excluded.map((id) => ({ id, missing: ["x"] })),
    activeKeys: ["x"],
  };
}

describe("summarizeGroups", () => {
  const party: Record<number, string> = { 1: "B", 2: "B", 3: "B", 4: "A", 5: "A", 6: "C", 7: "C" };
  const groupOf = (id: number) => party[id];

  it("mediana, menor e maior nota e contagens por partido", () => {
    const summary = summarizeGroups({
      result: result(
        [
          [1, 90],
          [2, 60],
          [3, 30],
          [4, 80],
          [5, 40],
        ],
        [6],
      ),
      groups: ["B", "A"],
      groupOf,
    });
    expect(summary).toEqual([
      { group: "A", included: 2, excluded: 0, median: 60, min: 40, max: 80, smallBase: true },
      { group: "B", included: 3, excluded: 0, median: 60, min: 30, max: 90, smallBase: true },
    ]);
  });

  it("partidos com a mesma mediana continuam em ordem alfabética", () => {
    const summary = summarizeGroups({
      result: result([
        [1, 50],
        [4, 50],
      ]),
      groups: ["B", "A"],
      groupOf,
    });
    expect(summary.map((s) => s.group)).toEqual(["A", "B"]);
    expect(summary.map((s) => s.median)).toEqual([50, 50]);
  });

  it("sai em ordem alfabética, nunca pela mediana", () => {
    const summary = summarizeGroups({
      result: result([
        [4, 10],
        [1, 99],
      ]),
      groups: ["B", "A"],
      groupOf,
    });
    expect(summary.map((s) => s.group)).toEqual(["A", "B"]);
  });

  it("partido sem nenhum deputado com dado: mediana null e contagem de fora", () => {
    const summary = summarizeGroups({
      result: result([[1, 70]], [6, 7]),
      groups: ["B", "C"],
      groupOf,
    });
    expect(summary[1]).toEqual({
      group: "C",
      included: 0,
      excluded: 2,
      median: null,
      min: null,
      max: null,
      smallBase: false,
    });
  });

  it("partido escolhido sem ninguém nos filtros aparece zerado, sem nota", () => {
    const [only] = summarizeGroups({ result: result([]), groups: ["Z"], groupOf });
    expect(only).toMatchObject({ group: "Z", included: 0, excluded: 0, median: null });
  });

  it("ignora deputados de partidos não escolhidos", () => {
    const [a] = summarizeGroups({
      result: result([
        [4, 20],
        [1, 100],
      ]),
      groups: ["A"],
      groupOf,
    });
    expect(a).toMatchObject({ included: 1, median: 20 });
  });

  it(`base pequena abaixo de ${GROUP_SMALL_BASE} deputados na conta`, () => {
    const ids = Array.from({ length: GROUP_SMALL_BASE }, (_, i) => i + 100);
    const many = summarizeGroups({
      result: result(ids.map((id) => [id, 50])),
      groups: ["G"],
      groupOf: () => "G",
    });
    expect(many[0]!.smallBase).toBe(false);
    const few = summarizeGroups({
      result: result(ids.slice(1).map((id) => [id, 50])),
      groups: ["G"],
      groupOf: () => "G",
    });
    expect(few[0]!.smallBase).toBe(true);
  });

  it("funciona com o resultado de buildRanking (empate de notas)", () => {
    const ranking = buildRanking({
      criteria: [{ key: "m", weight: 1, direction: "more" }],
      values: {
        m: new Map([
          [1, 5],
          [2, 5],
          [4, 1],
          [5, 9],
        ]),
      },
      ids: [1, 2, 4, 5, 6],
    });
    const summary = summarizeGroups({ result: ranking, groups: ["A", "B", "C"], groupOf });
    // Percentis: 1 → 0; 5 e 5 → 0,5 (empate); 9 → 1.
    expect(summary).toEqual([
      { group: "A", included: 2, excluded: 0, median: 50, min: 0, max: 100, smallBase: true },
      { group: "B", included: 2, excluded: 0, median: 50, min: 50, max: 50, smallBase: true },
      {
        group: "C",
        included: 0,
        excluded: 1,
        median: null,
        min: null,
        max: null,
        smallBase: false,
      },
    ]);
  });
});

describe("filtros com vários valores na URL", () => {
  const known = new Set(["PL", "PT", "UNIÃO", "PSOL"]);

  it("lê vários valores, ignora desconhecidos e repetidos e ordena", () => {
    expect(parseFilterList("PT,PL,XYZ,PT, PSOL", known)).toEqual(["PL", "PSOL", "PT"]);
  });

  it("aceita o formato antigo, de um valor só", () => {
    expect(parseFilterList("PL", known)).toEqual(["PL"]);
  });

  it("vazio vira lista vazia", () => {
    expect(parseFilterList("", known)).toEqual([]);
  });

  it("ida e volta pela URL", () => {
    const text = serializeFilterList(["UNIÃO", "PL", "PL"]);
    expect(text).toBe("PL,UNIÃO");
    const params = new URLSearchParams({ partido: text });
    expect(parseFilterList(new URLSearchParams(params.toString()).get("partido")!, known)).toEqual([
      "PL",
      "UNIÃO",
    ]);
  });
});
