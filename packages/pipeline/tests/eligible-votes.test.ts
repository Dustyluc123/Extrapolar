import { describe, expect, it } from "vitest";
import {
  classifyVote,
  parseMeritDescription,
  propositionKey,
  propositionLabel,
  type PropositionInfo,
} from "../src/normalize/eligible-votes";

// Descrições reais dos arquivos votacoes-{ano}.json (2023 a 2026).
const MERIT = [
  "Aprovado o Projeto de Lei nº 6.139, de 2023, ressalvado o destaque. Sim: 340; Não: 108; Abstenção: 1; Total: 449.",
  "Aprovada, em segundo turno, a Proposta de Emenda à Constituição n° 383, de 2017. Sim: 444; Não: 12; Total: 456.",
  "Aprovado o Substitutivo ao Projeto de Lei Complementar nº 14, de 2026, adotado pelo relator da Comissão de Indústria, Comércio e Serviços. Sim: 317; Não: 61; Total: 380.",
  "Aprovada a Medida Provisória nº 1.313 de 2025, na forma do Projeto de Lei de Conversão, ressalvados os destaques. Sim: 415; Não: 29; Total: 446.",
  "Aprovada a Subemenda Substitutiva Global ao Projeto de Lei Complementar nº 186, de 2026, adotada pelo relator.",
  "Rejeitada a Subemenda Substitutiva ao Projeto de Lei Complementar nº 281, de 2019, adotada pelo relator da Comissão Especial. Sim: 252; Não: 176; Total: 428.",
  "Aprovado o Substitutivo Reformulado ao Projeto de Lei nº 1.637, de 2019, adotado pelo relator.",
  "Aprovado, em primeiro turno, o Substitutivo adotado pelo Relator da Comissão Especial à Proposta de Emenda à Constituição nº 9, de 2023.",
  "Aprovado o Substitutivo do Senado Federal ao Projeto de Lei nº 2.148, de 2015, com exceção do art. 56.",
];

const PROCEDURE = [
  "Aprovado o Requerimento de Urgência (Art. 155 do RICD). Sim: 337; Não: 19; Total: 356.",
  "Rejeitado o Requerimento. Sim: 22; Não: 362; Total: 384.",
  "Mantido o texto. Sim: 401; Não: 34; Total: 435.",
  "Rejeitada a Emenda de Plenário nº 2. Sim: 134; Não: 285; Abstenção: 2; Total: 421.",
  "Rejeitado o Recurso nº 2, de 2026, contra parecer terminativo da Comissão de Constituição e Justiça.",
  "Aprovada a preferência. Sim: 467; Não: 4; Total: 472.",
  "Resultado. Sim: 182; Não: 182; Abstenção: 2; Total: 366.",
  "Aprovada a Emenda de Redação nº 4. Sim: 386; Não: 1; Total: 387.",
  "Aprovadas as Emendas do Senado Federal nºs 1 a 2; e 4 a 12 ao Projeto de Lei nº 914, de 2024.",
  "Aprovado, em apreciação preliminar, o Parecer da Comissão Mista de Planos, Orçamentos Públicos e Fiscalização.",
  "Aprovada a Redação Final assinada pelo relator, Dep. Zé Vitor (PL-MG).",
  "Aprovada a Emenda Aglutinativa nº 2. Sim: 400; Não: 10; Total: 410.",
];

describe("descrição de mérito", () => {
  it.each(MERIT)("reconhece mérito: %s", (description) => {
    expect(parseMeritDescription(description)).not.toBeNull();
  });

  it.each(PROCEDURE)("procedimento, destaque ou emenda fica fora: %s", (description) => {
    expect(parseMeritDescription(description)).toBeNull();
  });

  it("lê turno, objeto e a proposição citada (com ponto no número e sem vírgula antes do ano)", () => {
    expect(parseMeritDescription(MERIT[1]!)).toEqual({
      approvedInText: true,
      turn: "segundo",
      object: "Proposta de Emenda à Constituição",
      ref: { type: "PEC", number: 383, year: 2017 },
    });
    expect(parseMeritDescription(MERIT[3]!)?.ref).toEqual({
      type: "MPV",
      number: 1313,
      year: 2025,
    });
    expect(parseMeritDescription(MERIT[2]!)?.ref).toEqual({ type: "PLP", number: 14, year: 2026 });
    expect(parseMeritDescription(MERIT[5]!)?.approvedInText).toBe(false);
  });
});

const PL_6139: PropositionInfo = {
  id: 2543171,
  type: "PL",
  number: 6139,
  year: 2023,
  summary: "Dispõe sobre algo.",
};
const MSC_112: PropositionInfo = {
  id: 1,
  type: "MSC",
  number: 112,
  year: 2026,
  summary: "Mensagem.",
};
const PDL_50: PropositionInfo = {
  id: 2604784,
  type: "PDL",
  number: 50,
  year: 2026,
  summary: "Aprova o texto do Acordo.",
};
const noLookup = () => undefined;

describe("votação elegível", () => {
  it("mérito com a proposição citada ligada à votação", () => {
    const r = classifyVote({
      description: MERIT[0]!,
      secret: false,
      approval: 1,
      linked: [PL_6139],
      lookup: noLookup,
    });
    expect(r).toMatchObject({ eligible: true, approved: true, proposition: PL_6139 });
  });

  it("proposição citada diferente da ligada: procura nos arquivos anuais", () => {
    const r = classifyVote({
      description:
        "Aprovado o Projeto de Decreto Legislativo nº 50, de 2026, adotado pelo relator.",
      secret: false,
      approval: 1,
      linked: [MSC_112],
      lookup: (key) => (key === "PDL 50/2026" ? PDL_50 : undefined),
    });
    expect(r).toMatchObject({ eligible: true, proposition: PDL_50 });
  });

  it("PDC antigo vale como PDL", () => {
    expect(propositionKey("PDC", 745, 2017)).toBe(propositionKey("PDL", 745, 2017));
    const r = classifyVote({
      description: "Aprovado o Projeto de Decreto Legislativo nº 745, de 2017. Sim: 323; não: 98.",
      secret: false,
      approval: 1,
      linked: [{ id: 9, type: "PDC", number: 745, year: 2017, summary: "Susta ato." }],
      lookup: noLookup,
    });
    expect(r.eligible).toBe(true);
  });

  it("na dúvida fica fora: proposição não achada, secreta, sem resultado oficial ou divergente", () => {
    const base = {
      description: MERIT[0]!,
      secret: false,
      approval: 1 as const,
      linked: [PL_6139],
      lookup: noLookup,
    };
    expect(classifyVote({ ...base, linked: [] })).toEqual({
      eligible: false,
      reason: "sem-proposicao",
    });
    expect(classifyVote({ ...base, secret: true })).toEqual({ eligible: false, reason: "secreta" });
    expect(classifyVote({ ...base, approval: undefined })).toEqual({
      eligible: false,
      reason: "sem-resultado",
    });
    expect(classifyVote({ ...base, approval: 0 })).toEqual({
      eligible: false,
      reason: "resultado-divergente",
    });
    expect(classifyVote({ ...base, description: PROCEDURE[0]! })).toEqual({
      eligible: false,
      reason: "procedimento",
    });
  });

  it("rejeitada com mais Sim que Não (quórum) segue o resultado oficial", () => {
    const r = classifyVote({
      description: MERIT[5]!,
      secret: false,
      approval: 0,
      linked: [{ id: 2, type: "PLP", number: 281, year: 2019, summary: "Altera a lei." }],
      lookup: noLookup,
    });
    expect(r).toMatchObject({ eligible: true, approved: false });
  });

  it("rótulo curto da proposição", () => {
    expect(propositionLabel(PL_6139)).toBe("PL 6.139/2023");
  });
});
