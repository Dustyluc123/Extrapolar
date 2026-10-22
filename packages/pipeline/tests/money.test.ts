import type { CamaraCeapRow, CguAmendmentRow } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import {
  amendmentRowsByAuthor,
  linkAmendmentAuthors,
  normalizeAuthorName,
  reduceCeap,
  type DeputyCeap,
} from "../src/normalize/money";

function ceap(id: string, mes: string, cat: string, valor: string, rest = ""): CamaraCeapRow {
  return {
    ideCadastro: id,
    numAno: "2026",
    numMes: mes,
    numSubCota: "1",
    txtDescricao: cat,
    sgUF: "SP",
    vlrLiquido: valor,
    vlrRestituicao: rest,
  };
}

describe("reduceCeap", () => {
  it("soma por mês e categoria, ignora lideranças e outros deputados", () => {
    const target = new Map<number, DeputyCeap>();
    reduceCeap(
      target,
      [
        ceap("10", "3", "TELEFONIA", "100.5"),
        ceap("10", "3", "TELEFONIA", "50"),
        ceap("10", "4", "COMBUSTÍVEIS", "-20", "30"),
        ceap("", "3", "TELEFONIA", "999"), // liderança
        ceap("99", "3", "TELEFONIA", "999"), // não é deputado atual
      ],
      new Set([10]),
    );
    expect(target.get(10)).toEqual({
      entries: [
        { month: "2026-03", category: "TELEFONIA", value: 150.5 },
        { month: "2026-04", category: "COMBUSTÍVEIS", value: -20 },
      ],
      restitutions: 30,
    });
    expect(target.has(99)).toBe(false);
  });
});

function emenda(
  code: string,
  name: string,
  ano: string,
  tipo = "Emenda Individual - Transferências Especiais",
): CguAmendmentRow {
  return {
    "Código da Emenda": "1",
    "Ano da Emenda": ano,
    "Tipo de Emenda": tipo,
    "Código do Autor da Emenda": code,
    "Nome do Autor da Emenda": name,
    "Localidade de aplicação do recurso": "RECIFE - PE",
    UF: "PERNAMBUCO",
    "Valor Empenhado": "1000,50",
    "Valor Liquidado": "0,00",
    "Valor Pago": "500,25",
    "Valor Restos A Pagar Inscritos": "0,00",
    "Valor Restos A Pagar Cancelados": "0,00",
    "Valor Restos A Pagar Pagos": "100,00",
  };
}

describe("normalizeAuthorName", () => {
  it("ignora acento, pontuação, caixa e o prefixo Dep.", () => {
    expect(normalizeAuthorName("DEP. JOSIVALDO JP")).toBe("josivaldo jp");
    expect(normalizeAuthorName("Dr. Allan Garcês")).toBe("dr allan garces");
  });
});

describe("linkAmendmentAuthors", () => {
  const rows = [
    emenda("1", "MARIA SILVA", "2024"),
    emenda("2", "DEP. JOAO PEREIRA", "2025"),
    emenda("3", "ANA SOUZA", "2020"), // só emendas antigas: identificada, sem emendas no período
    emenda("4", "PEDRO LIMA", "2024"),
    emenda("5", "PEDRO LIMA", "2025"), // nome repetido com outro código: ambíguo
    emenda("6", "SENADORA X", "2024"),
    emenda("7", "BANCADA DE PE", "2024", "Emenda de Bancada"),
  ];
  const deputies = [
    { id: 10, name: "Maria Silva" },
    { id: 11, name: "João Pereira" },
    { id: 12, name: "Ana Souza" },
    { id: 13, name: "Pedro Lima" },
    { id: 14, name: "Carla Dias" },
  ];

  it("liga só por nome exato e único; ambíguos e ausentes ficam sem ligação", () => {
    const result = linkAmendmentAuthors({ rows, deputies, manual: {}, years: [2024, 2025] });
    expect([...result.links.entries()].map(([id, l]) => [id, l.code, l.via])).toEqual([
      [10, "1", "nome"],
      [11, "2", "nome"],
      [12, "3", "nome"],
    ]);
    expect(result.unlinkedAuthors.map((a) => a.code)).toEqual(["4", "5", "6"]);
  });

  it("correspondência manual tem prioridade (inclusive null)", () => {
    const result = linkAmendmentAuthors({
      rows,
      deputies,
      manual: { 13: "5", 10: null },
      years: [2024, 2025],
    });
    expect(result.links.get(13)).toMatchObject({ code: "5", via: "manual" });
    expect(result.links.has(10)).toBe(false);
  });
});

describe("amendmentRowsByAuthor", () => {
  it("converte valores com vírgula e filtra os anos", () => {
    const byAuthor = amendmentRowsByAuthor(
      [emenda("1", "A", "2024"), emenda("1", "A", "2022")],
      [2024],
    );
    expect(byAuthor.get("1")).toEqual([
      {
        year: 2024,
        type: "Emenda Individual - Transferências Especiais",
        location: "RECIFE - PE",
        committed: 1000.5,
        liquidated: 0,
        paid: 500.25,
        carriedPaid: 100,
      },
    ]);
  });
});
