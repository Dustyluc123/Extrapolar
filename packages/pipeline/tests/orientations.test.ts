import type { CamaraOrientation } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import {
  bancadaKind,
  bancadaMatchesFederation,
  bancadaMatchesParty,
  resolveGovernmentOrientation,
  resolvePartyOrientation,
} from "../src/normalize/orientations";

const FEDERATIONS = [
  { name: "Federação Brasil da Esperança - Fe Brasil", parties: ["PT", "PCdoB", "PV"] },
  { name: "Federação PSDB CIDADANIA", parties: ["PSDB", "CIDADANIA"] },
];

function o(siglaBancada: string, orientacao: CamaraOrientation["orientacao"]): CamaraOrientation {
  return { idVotacao: "1-1", siglaOrgao: "PLEN", siglaBancada, orientacao };
}

describe("tipos de bancada", () => {
  it("classifica lideranças, federações, blocos e partidos", () => {
    expect(bancadaKind("Governo")).toBe("lideranca");
    expect(bancadaKind("Oposição")).toBe("lideranca");
    expect(bancadaKind("Fdr PT-PCdoB-PV")).toBe("federacao");
    expect(bancadaKind("Bl UniPpPsd...")).toBe("bloco");
    expect(bancadaKind("Bloco Parlamentar")).toBe("bloco");
    expect(bancadaKind("PL")).toBe("partido");
  });

  it("reconhece o partido mesmo com nome truncado, sem acento ou apelido", () => {
    expect(bancadaMatchesParty("Solidaried", "SOLIDARIEDADE")).toBe(true);
    expect(bancadaMatchesParty("Republican", "REPUBLICANOS")).toBe(true);
    expect(bancadaMatchesParty("União", "UNIÃO")).toBe(true);
    expect(bancadaMatchesParty("Novo", "NOVO")).toBe(true);
    expect(bancadaMatchesParty("Podemos", "PODE")).toBe(true);
    expect(bancadaMatchesParty("PP", "PPS")).toBe(false);
    expect(bancadaMatchesParty("PL", "PLS")).toBe(false);
  });

  it("reconhece a federação pelos partidos, inclusive com nome truncado", () => {
    expect(bancadaMatchesFederation("Fdr PT-PCdoB-PV", FEDERATIONS[0]!)).toBe(true);
    expect(bancadaMatchesFederation("Fdr PSDB-CIDADAN", FEDERATIONS[1]!)).toBe(true);
    expect(bancadaMatchesFederation("Fdr PSDB-CIDADAN", FEDERATIONS[0]!)).toBe(false);
  });
});

describe("resolvePartyOrientation", () => {
  it("usa a orientação do próprio partido", () => {
    expect(
      resolvePartyOrientation([o("PL", "Sim"), o("Governo", "Não")], "PL", FEDERATIONS),
    ).toEqual({ orientation: { kind: "value", value: "yes" }, fromFederation: false });
  });

  it("sem orientação do partido, usa a da federação", () => {
    expect(
      resolvePartyOrientation([o("Fdr PT-PCdoB-PV", "Não"), o("PL", "Sim")], "PCdoB", FEDERATIONS),
    ).toEqual({ orientation: { kind: "value", value: "no" }, fromFederation: true });
  });

  it("só com orientação de bloco, não atribui ao partido", () => {
    expect(
      resolvePartyOrientation([o("Bl UniPpPsd...", "Sim"), o("PL", "Não")], "PP", FEDERATIONS),
    ).toEqual({ orientation: { kind: "bloc-only" }, fromFederation: false });
  });

  it("liberado e sem orientação são distintos", () => {
    expect(resolvePartyOrientation([o("PSB", "Liberado")], "PSB", FEDERATIONS).orientation).toEqual(
      {
        kind: "free",
      },
    );
    expect(resolvePartyOrientation([o("PSB", "")], "PSB", FEDERATIONS).orientation).toEqual({
      kind: "none",
    });
    expect(resolvePartyOrientation([o("PL", "Sim")], "PSB", FEDERATIONS).orientation).toEqual({
      kind: "none",
    });
    expect(resolvePartyOrientation(undefined, "PSB", FEDERATIONS).orientation).toEqual({
      kind: "none",
    });
  });
});

describe("resolveGovernmentOrientation", () => {
  it("usa a bancada Governo", () => {
    expect(resolveGovernmentOrientation([o("PL", "Não"), o("Governo", "Sim")])).toEqual({
      kind: "value",
      value: "yes",
    });
    expect(resolveGovernmentOrientation([o("PL", "Não")])).toEqual({ kind: "none" });
  });
});
