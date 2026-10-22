import { describe, expect, it } from "vitest";
import {
  buildRanking,
  parseCriteria,
  percentiles,
  serializeCriteria,
  type RankingCriterion,
} from "../src/index";

const map = (entries: Array<[number, number]>) => new Map(entries);

describe("percentis", () => {
  it("do menor (0) ao maior (1)", () => {
    expect(
      percentiles(
        map([
          [1, 10],
          [2, 20],
          [3, 30],
        ]),
      ),
    ).toEqual(
      map([
        [1, 0],
        [2, 0.5],
        [3, 1],
      ]),
    );
  });

  it("empates recebem a média das posições", () => {
    const p = percentiles(
      map([
        [1, 5],
        [2, 5],
        [3, 9],
      ]),
    );
    expect(p.get(1)).toBe(0.25);
    expect(p.get(2)).toBe(0.25);
    expect(p.get(3)).toBe(1);
  });

  it("um valor só, ou todos iguais, fica em 0,5", () => {
    expect(percentiles(map([[1, 3]])).get(1)).toBe(0.5);
    expect([
      ...percentiles(
        map([
          [1, 2],
          [2, 2],
        ]),
      ).values(),
    ]).toEqual([0.5, 0.5]);
  });

  it("reais e porcentagens viram a mesma escala", () => {
    const reais = percentiles(
      map([
        [1, 1_000_000],
        [2, 2_000_000],
      ]),
    );
    const pct = percentiles(
      map([
        [1, 0.2],
        [2, 0.9],
      ]),
    );
    expect(reais).toEqual(pct);
  });
});

const values = {
  a: map([
    [1, 10],
    [2, 20],
    [3, 30],
  ]),
  b: map([
    [1, 300],
    [2, 200],
    [3, 100],
  ]),
  c: map([
    [1, 1],
    [2, 2],
  ]), // deputado 3 sem dado
};
const ids = [1, 2, 3];

describe("ranking com os critérios do usuário", () => {
  it("sem critérios (ou só peso zero), não há ranking", () => {
    expect(buildRanking({ criteria: [], values, ids }).ranked).toEqual([]);
    expect(
      buildRanking({ criteria: [{ key: "a", weight: 0, direction: "more" }], values, ids }).ranked,
    ).toEqual([]);
  });

  it("uma métrica só: a nota é o percentil × 100", () => {
    const r = buildRanking({ criteria: [{ key: "a", weight: 3, direction: "more" }], values, ids });
    expect(r.ranked.map((x) => [x.id, x.position, x.score])).toEqual([
      [3, 1, 100],
      [2, 2, 50],
      [1, 3, 0],
    ]);
  });

  it("direção invertida: menos sobe", () => {
    const r = buildRanking({ criteria: [{ key: "a", weight: 1, direction: "less" }], values, ids });
    expect(r.ranked.map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it("peso zero não entra na nota nem exclui quem não tem dado", () => {
    const criteria: RankingCriterion[] = [
      { key: "a", weight: 2, direction: "more" },
      { key: "c", weight: 0, direction: "more" },
    ];
    const r = buildRanking({ criteria, values, ids });
    expect(r.excluded).toEqual([]);
    expect(r.activeKeys).toEqual(["a"]);
  });

  it("sem dado não é zero: o deputado sai da classificação e vai para a lista à parte", () => {
    const r = buildRanking({ criteria: [{ key: "c", weight: 1, direction: "more" }], values, ids });
    expect(r.ranked.map((x) => x.id)).toEqual([2, 1]);
    expect(r.excluded).toEqual([{ id: 3, missing: ["c"] }]);
  });

  it("empate na nota divide a posição", () => {
    const criteria: RankingCriterion[] = [
      { key: "a", weight: 1, direction: "more" },
      { key: "b", weight: 1, direction: "more" },
    ];
    // a e b andam em sentidos opostos: todos ficam com 50
    const r = buildRanking({ criteria, values, ids });
    expect(r.ranked.map((x) => x.position)).toEqual([1, 1, 1]);
    expect(r.ranked.every((x) => Math.abs(x.score - 50) < 1e-9)).toBe(true);
  });

  it("contribuições somam a nota e respeitam os pesos", () => {
    const criteria: RankingCriterion[] = [
      { key: "a", weight: 3, direction: "more" },
      { key: "b", weight: 1, direction: "less" },
    ];
    const r = buildRanking({ criteria, values, ids });
    const top = r.ranked[0]!;
    expect(top.id).toBe(3);
    expect(top.contributions).toEqual([
      { key: "a", percentile: 1, points: 75 },
      { key: "b", percentile: 1, points: 25 },
    ]);
    expect(top.score).toBe(100);
  });

  it("filtro (ids) não muda o percentil, calculado na Câmara inteira", () => {
    const r = buildRanking({
      criteria: [{ key: "a", weight: 1, direction: "more" }],
      values,
      ids: [2],
    });
    expect(r.ranked).toEqual([
      { id: 2, position: 1, score: 50, contributions: [{ key: "a", percentile: 0.5, points: 50 }] },
    ]);
  });
});

describe("critérios na URL", () => {
  const known = new Set(["participacao", "cota-total"]);

  it("ida e volta", () => {
    const criteria: RankingCriterion[] = [
      { key: "participacao", weight: 3, direction: "more" },
      { key: "cota-total", weight: 2, direction: "less" },
    ];
    const text = serializeCriteria(criteria);
    expect(text).toBe("participacao.3.mais,cota-total.2.menos");
    expect(parseCriteria(text, known)).toEqual(criteria);
  });

  it("ignora métrica desconhecida, peso fora de 0–5, repetição e lixo", () => {
    expect(
      parseCriteria(
        "x.3.mais,participacao.9.mais,participacao.1.menos,participacao.2.mais,;;",
        known,
      ),
    ).toEqual([{ key: "participacao", weight: 1, direction: "less" }]);
  });
});
