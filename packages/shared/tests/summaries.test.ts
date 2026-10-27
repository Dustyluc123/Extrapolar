import { describe, expect, it } from "vitest";
import { glossarySlugs, parseSummaryFile, splitGlossaryLinks } from "../src/summaries";

const full = `---
revisado: false
autor: Claude (rascunho)
data: 2026-10-26
fonte: https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=1
---

## O que estava em votação

O texto cria uma regra
em duas linhas, com [PEC](/glossario#pec).

## Curiosidade

Uma [PEC](/glossario#pec) é votada em dois turnos.

## Dúvidas

- Não ficou claro o prazo.
`;

describe("resumos em linguagem simples: seções", () => {
  it("lê as três seções e junta as linhas de cada parágrafo", () => {
    expect(parseSummaryFile("1-2", full)).toEqual({
      voteId: "1-2",
      reviewed: false,
      text: "O texto cria uma regra em duas linhas, com [PEC](/glossario#pec).",
      curiosity: "Uma [PEC](/glossario#pec) é votada em dois turnos.",
      doubts: "- Não ficou claro o prazo.",
      source: "https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=1",
    });
  });

  it("revisado com dúvidas pendentes para com mensagem clara", () => {
    expect(() =>
      parseSummaryFile("1-2", full.replace("revisado: false", "revisado: true")),
    ).toThrow(/Dúvidas/);
  });

  it("curiosidade é opcional", () => {
    const s = parseSummaryFile(
      "1-2",
      "---\nrevisado: true\n---\n## O que estava em votação\n\nTexto.\n",
    );
    expect(s.curiosity).toBeNull();
    expect(s.text).toBe("Texto.");
  });

  it("recusa seção desconhecida, fora de ordem ou texto solto antes da primeira", () => {
    expect(() => parseSummaryFile("1-2", "---\nrevisado: false\n---\n## Opinião\nX")).toThrow(
      /seção desconhecida/,
    );
    expect(() =>
      parseSummaryFile(
        "1-2",
        "---\nrevisado: false\n---\n## Curiosidade\nX\n## O que estava em votação\nY",
      ),
    ).toThrow(/fora de ordem/);
    expect(() =>
      parseSummaryFile("1-2", "---\nrevisado: false\n---\nSolto\n## O que estava em votação\nY"),
    ).toThrow(/antes da primeira seção/);
  });

  it("só aceita links para o glossário", () => {
    expect(() =>
      parseSummaryFile(
        "1-2",
        "---\nrevisado: false\n---\n## O que estava em votação\nVeja [isto](https://exemplo.com).",
      ),
    ).toThrow(/glossário/);
    expect(() =>
      parseSummaryFile(
        "1-2",
        "---\nrevisado: false\n---\n## O que estava em votação\nVeja https://exemplo.com",
      ),
    ).toThrow(/glossário/);
  });

  it("fonte precisa ser um link", () => {
    expect(() => parseSummaryFile("1-2", "---\nrevisado: false\nfonte: talvez\n---\nX")).toThrow(
      /fonte/,
    );
  });
});

describe("links do glossário", () => {
  it("separa texto e links", () => {
    expect(splitGlossaryLinks("Uma [PEC](/glossario#pec) e um [PL](/glossario#pl).")).toEqual([
      { text: "Uma " },
      { text: "PEC", glossary: "pec" },
      { text: " e um " },
      { text: "PL", glossary: "pl" },
      { text: "." },
    ]);
    expect(glossarySlugs("[PEC](/glossario#pec) [x](/glossario#quorum)")).toEqual([
      "pec",
      "quorum",
    ]);
  });
});
