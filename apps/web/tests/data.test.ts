import { describe, expect, it } from "vitest";
import { JsonDeputyRepository, repository } from "../src/lib/data";

describe("JsonDeputyRepository com os dados gerados", () => {
  it("lista os deputados em ordem alfabética", async () => {
    const deputies = await repository.listDeputies();
    expect(deputies.length).toBeGreaterThan(0);
    const names = deputies.map((d) => d.name);
    const sorted = [...names].sort(new Intl.Collator("pt-BR", { sensitivity: "base" }).compare);
    expect(names).toEqual(sorted);
  });

  it("toda ficha tem participação calculada", async () => {
    for (const deputy of await repository.listDeputies()) {
      const profile = await repository.getDeputy(deputy.id);
      expect(profile?.participation?.deputyId).toBe(deputy.id);
    }
  });

  it("deputado inexistente devolve null", async () => {
    expect(await repository.getDeputy(-1)).toBeNull();
  });
});

describe("JsonDeputyRepository com dado quebrado", () => {
  it("falha na construção (quebra o build) com mensagem clara", () => {
    expect(
      () =>
        new JsonDeputyRepository({
          deputies: { schemaVersion: 1, legislatureId: 57, deputies: [{ id: "x" }] },
          participation: {},
          meta: {},
        }),
    ).toThrow(/Dados inválidos em data\/generated\/deputados\.json/);
  });
});
