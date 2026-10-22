import type { CamaraProposition } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import type { Authorship } from "../src/normalize/committees";
import {
  addThemes,
  isKeptProposition,
  reducePropositions,
  type PropositionsReduction,
} from "../src/normalize/propositions";

function prop(
  id: number,
  siglaTipo: string,
  extra: Partial<CamaraProposition> = {},
): CamaraProposition {
  return {
    id,
    siglaTipo,
    codTipo: 139,
    descricaoTipo: siglaTipo === "PL" ? "Projeto de Lei" : siglaTipo,
    numero: id,
    ano: 2024,
    ementa: "Ementa de teste.",
    dataApresentacao: "2024-05-10T10:00:00",
    uriPropPrincipal: "",
    uriOrgaoNumerador: "https://dadosabertos.camara.leg.br/api/v2/orgaos/180",
    ultimoStatus: { idSituacao: "915", descricaoSituacao: "Aguardando Parecer" },
    ...extra,
  };
}

const RANGE = { start: "2023-02-01T00:00:00", limit: "2026-10-22T00:00:00" };

describe("isKeptProposition", () => {
  it("guarda tipos principais, pareceres, fiscalização e convocações pelo tipo oficial", () => {
    expect(isKeptProposition({ siglaTipo: "PL", codTipo: 139 })).toBe(true);
    expect(isKeptProposition({ siglaTipo: "PRL", codTipo: 190 })).toBe(true);
    expect(isKeptProposition({ siglaTipo: "RIC", codTipo: 148 })).toBe(true);
    expect(isKeptProposition({ siglaTipo: "REQ", codTipo: 523 })).toBe(true);
    expect(isKeptProposition({ siglaTipo: "REQ", codTipo: 294 })).toBe(false);
    expect(isKeptProposition({ siglaTipo: "EMC", codTipo: 1 })).toBe(false);
  });
});

describe("reducePropositions", () => {
  it("fica só com proposições de deputados atuais, na legislatura, e conta todos os tipos", () => {
    const authorship = new Map<number, Authorship[]>([
      [
        1,
        [
          { deputyId: 10, order: 1, proponent: true },
          { deputyId: 11, order: 2, proponent: true },
        ],
      ],
      [2, [{ deputyId: 10, order: 1, proponent: true }]],
      [3, [{ deputyId: 99, order: 1, proponent: true }]], // não é deputado atual
      [4, [{ deputyId: 10, order: 1, proponent: true }]],
      [5, [{ deputyId: 11, order: 3, proponent: false }]], // apoio
    ]);
    const target: PropositionsReduction = { propositions: new Map(), typeCounts: new Map() };
    reducePropositions({
      target,
      items: [
        prop(1, "PL", {
          uriPropPrincipal: "https://dadosabertos.camara.leg.br/api/v2/proposicoes/77",
        }),
        prop(2, "EMC", { codTipo: 5, descricaoTipo: "Emenda na Comissão" }),
        prop(3, "PL"),
        prop(4, "PL", { dataApresentacao: "2022-12-01T10:00:00" }), // antes da legislatura
        prop(5, "PEC"),
      ],
      authorship,
      deputyIds: new Set([10, 11]),
      ...RANGE,
    });
    expect([...target.propositions.keys()].sort()).toEqual([1, 5]);
    expect(target.propositions.get(1)).toMatchObject({
      type: "PL",
      date: "2024-05-10",
      organId: 180,
      principalId: 77,
    });
    expect([...(target.typeCounts.get(10)?.values() ?? [])]).toEqual([
      { sigla: "PL", name: "Projeto de Lei", first: 1, coauthor: 0 },
      { sigla: "EMC", name: "Emenda na Comissão", first: 1, coauthor: 0 },
    ]);
    // coautoria conta; apoio não conta como autoria
    expect([...(target.typeCounts.get(11)?.values() ?? [])]).toEqual([
      { sigla: "PL", name: "Projeto de Lei", first: 0, coauthor: 1 },
    ]);
  });
});

describe("addThemes", () => {
  it("guarda temas só das proposições principais guardadas, sem repetir", () => {
    const propositions = new Map([
      [
        1,
        {
          id: 1,
          type: "PL",
          codType: 139,
          date: "2024-01-01",
          situationId: "",
          organId: 1,
          principalId: null,
        },
      ],
      [
        2,
        {
          id: 2,
          type: "RIC",
          codType: 148,
          date: "2024-01-01",
          situationId: "",
          organId: 1,
          principalId: null,
        },
      ],
    ]);
    const target = new Map<number, number[]>();
    const uri = (id: number) => `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}`;
    addThemes(
      target,
      [
        { uriProposicao: uri(1), codTema: 56, tema: "Saúde" },
        { uriProposicao: uri(1), codTema: 56, tema: "Saúde" },
        { uriProposicao: uri(1), codTema: 72, tema: "Homenagens e Datas Comemorativas" },
        { uriProposicao: uri(2), codTema: 34, tema: "Administração Pública" },
        { uriProposicao: uri(3), codTema: 34, tema: "Administração Pública" },
      ],
      propositions,
    );
    expect([...target.entries()]).toEqual([[1, [56, 72]]]);
  });
});
