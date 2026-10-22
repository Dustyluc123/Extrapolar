import { describe, expect, it } from "vitest";
import type { Deputy, DeputyDetail } from "@extrapolar/shared";
import { currentCommittees, dleDeputy, legislatureStartYear } from "../src/steps/games/dle";

const membership = (
  sigla: string,
  tipo: string,
  cargo: string,
  inicio: string,
  fim: string | null,
) => ({
  organId: sigla.length,
  sigla,
  nome: sigla,
  tipo,
  cargo,
  inicio,
  fim,
});

const detail = {
  comissoes: {
    participacoes: [
      membership("CCJC", "Comissão Permanente", "Titular", "2025-03-01", null),
      membership("CFT", "Comissão Permanente", "1º Vice-Presidente", "2025-03-01", "2026-12-31"),
      membership("CE", "Comissão Permanente", "Suplente", "2025-03-01", null),
      membership(
        "CPIX",
        "Comissão Parlamentar de Inquérito",
        "Titular",
        "2024-01-01",
        "2024-06-01",
      ),
      membership("CMULHER", "COORDENADORIA DA MULHER", "Titular", "2025-03-01", null),
      membership("PEC0124", "Comissão Especial", "Presidente", "2026-10-30", null),
    ],
  },
  projetos: { autorPrincipal: 12 },
} as unknown as DeputyDetail;

describe("Dle: atributos", () => {
  it("ano de início da legislatura (só da 39ª em diante)", () => {
    expect(legislatureStartYear(57)).toBe(2023);
    expect(legislatureStartYear(56)).toBe(2019);
    expect(legislatureStartYear(39)).toBe(1951);
    expect(legislatureStartYear(38)).toBeNull();
  });

  it("comissões em que é titular hoje: tipo de comissão, cargo com voto, dentro do período", () => {
    expect(currentCommittees(detail, "2026-10-22")).toEqual(["CCJC", "CFT"]);
  });

  it("monta o deputado com nascimento e estreia; sem registro vira sem dado", () => {
    const deputy = {
      id: 1,
      name: "Fulana",
      party: "PT",
      state: "SP",
      electoralCondition: "Titular",
    } as Deputy;
    expect(
      dleDeputy(
        deputy,
        detail,
        { birthDate: "1980-05-02", birthState: "BA", firstLegislature: 55 },
        "2026-10-22",
      ),
    ).toEqual({
      id: 1,
      name: "Fulana",
      party: "PT",
      condition: "Titular",
      since: 2015,
      birthYear: 1980,
      birthState: "BA",
      committees: ["CCJC", "CFT"],
      projects: 12,
    });
    expect(dleDeputy(deputy, detail, undefined, "2026-10-22")).toMatchObject({
      since: null,
      birthYear: null,
      birthState: null,
    });
  });
});
