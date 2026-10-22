import { describe, expect, it } from "vitest";
import {
  agreement,
  compareAll,
  compareAttribute,
  dleShareText,
  maxGuessesFor,
  placarScore,
  searchNames,
  stateMajority,
  yesShare,
  type AttributeDefinition,
} from "../src/index";

const party: AttributeDefinition = {
  key: "party",
  label: "Partido",
  kind: "text",
  groups: { PT: "Fdr PT-PCdoB-PV", PV: "Fdr PT-PCdoB-PV" },
};
const birth: AttributeDefinition = {
  key: "birth",
  label: "Nascimento",
  kind: "number",
  tolerance: 5,
};
const projects: AttributeDefinition = {
  key: "projects",
  label: "Projetos",
  kind: "number",
  relativeTolerance: 0.2,
};
const committees: AttributeDefinition = { key: "committees", label: "Comissões", kind: "list" };

describe("comparação de atributos (Dle)", () => {
  it("texto igual, ignorando acento e maiúsculas", () => {
    expect(compareAttribute(party, "PT", "pt").status).toBe("hit");
  });

  it("partidos da mesma federação contam como perto", () => {
    expect(compareAttribute(party, "PV", "PT").status).toBe("near");
    expect(compareAttribute(party, "PL", "PT").status).toBe("miss");
  });

  it("número: seta para cima quando o do dia é maior; perto dentro da tolerância", () => {
    expect(compareAttribute(birth, 1970, 1974)).toEqual({
      key: "birth",
      status: "near",
      direction: "up",
    });
    expect(compareAttribute(birth, 1990, 1974)).toEqual({
      key: "birth",
      status: "miss",
      direction: "down",
    });
    expect(compareAttribute(birth, 1974, 1974)).toEqual({ key: "birth", status: "hit" });
  });

  it("tolerância relativa: 20% do valor do deputado do dia", () => {
    expect(compareAttribute(projects, 45, 50).status).toBe("near");
    expect(compareAttribute(projects, 30, 50).status).toBe("miss");
    // valor zero do dia: nenhuma folga
    expect(compareAttribute(projects, 1, 0).status).toBe("miss");
  });

  it("lista: igual, alguma em comum ou nenhuma", () => {
    expect(compareAttribute(committees, ["CCJC", "CFT"], ["cft", "ccjc"]).status).toBe("hit");
    expect(compareAttribute(committees, ["CCJC"], ["CCJC", "CFT"]).status).toBe("near");
    expect(compareAttribute(committees, ["CE"], ["CFT"]).status).toBe("miss");
    expect(compareAttribute(committees, [], []).status).toBe("hit");
  });

  it("sem dado de um lado não conta como erro", () => {
    expect(compareAttribute(birth, null, 1970).status).toBe("unknown");
  });

  it("compara todos os atributos na ordem definida", () => {
    const rows = compareAll(
      [party, birth],
      { party: "PT", birth: 1980 },
      { party: "PT", birth: 1980 },
    );
    expect(rows.map((r) => r.status)).toEqual(["hit", "hit"]);
  });

  it("número de chutes pelo tamanho da bancada", () => {
    expect(maxGuessesFor(8)).toBe(6);
    expect(maxGuessesFor(30)).toBe(8);
    expect(maxGuessesFor(70)).toBe(10);
  });

  it("autocompletar ignora acentos e prefere quem começa com o texto", () => {
    const items = [
      { name: "Acácio Favacho" },
      { name: "Zé Silva" },
      { name: "Joaquim Passarinho" },
    ];
    expect(searchNames(items, "aca").map((i) => i.name)).toEqual(["Acácio Favacho"]);
    expect(searchNames(items, "ze").map((i) => i.name)).toEqual(["Zé Silva"]);
    expect(searchNames(items, "silva", new Set(["Zé Silva"]))).toEqual([]);
  });

  it("compartilhar mostra quadradinhos e não o nome", () => {
    const text = dleShareText({
      number: 3,
      state: "AP",
      rows: [
        [
          { key: "party", status: "miss" },
          { key: "birth", status: "near", direction: "up" },
        ],
        [
          { key: "party", status: "hit" },
          { key: "birth", status: "hit" },
        ],
      ],
      won: true,
      maxGuesses: 6,
      url: "https://exemplo/jogos/dle",
    });
    expect(text).toContain("🟥🟨");
    expect(text).toContain("🟩🟩");
    expect(text).toContain("Acertei em 2 de 6 chutes");
  });
});

describe("placar (Jogo 2)", () => {
  it("porcentagem de Sim entre Sim e Não", () => {
    expect(yesShare(300, 100)).toBe(75);
    expect(yesShare(0, 0)).toBeNull();
  });

  it("pontos caem 2 por ponto percentual de distância, sem ficar negativos", () => {
    expect(placarScore(75, 75)).toBe(100);
    expect(placarScore(65, 75)).toBe(80);
    expect(placarScore(10, 90)).toBe(0);
  });

  it("maioria do estado: só Sim e Não contam; empate e nenhum voto são respostas", () => {
    expect(stateMajority(["yes", "yes", "no", "abstention", null])).toBe("yes");
    expect(stateMajority(["yes", "no"])).toBe("tie");
    expect(stateMajority(["obstruction", null])).toBe("none");
  });
});

describe("concordância (Jogo 3)", () => {
  it("votos iguais ÷ votações em que os dois votaram Sim ou Não", () => {
    const result = agreement(
      { v1: "yes", v2: "no", v3: "yes", v4: null, v5: "yes" },
      { v1: "yes", v2: "yes", v3: "abstention", v4: "no", v5: null },
    );
    expect(result).toEqual({ compared: 2, agreed: 1, otherBallots: 1, rate: 0.5, smallBase: true });
  });

  it("sem nenhuma votação em comum: sem dado, nunca 0%", () => {
    expect(agreement({ v1: "yes" }, { v1: null }).rate).toBeNull();
  });

  it("cinco ou mais comparadas não têm aviso de base pequena", () => {
    const player = { a: "yes", b: "yes", c: "no", d: "no", e: "yes" } as const;
    expect(agreement(player, player).smallBase).toBe(false);
    expect(agreement(player, player).rate).toBe(1);
  });
});

describe("votos compactos e quórum", () => {
  it("decodifica cada caractere", async () => {
    const { decodeBallot } = await import("../src/index");
    expect(["S", "N", "A", "O", "P", "-", undefined].map(decodeBallot)).toEqual([
      "yes",
      "no",
      "abstention",
      "obstruction",
      "article17",
      null,
      null,
    ]);
  });

  it("quórum pelo tipo da proposição", async () => {
    const { requiredYesVotes } = await import("../src/index");
    expect(requiredYesVotes("PLP 281/2019")).toBe(257);
    expect(requiredYesVotes("PEC 45/2019")).toBe(308);
    expect(requiredYesVotes("PL 6.139/2023")).toBeNull();
  });
});
