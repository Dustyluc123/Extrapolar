import { describe, expect, it } from "vitest";
import {
  DataValidationError,
  camaraBallotsFileSchema,
  camaraDeputyListPageSchema,
  camaraHistoryResponseSchema,
  camaraVotesFileSchema,
  deputiesFileSchema,
  parseOrThrow,
  participationFileSchema,
} from "../src/index";
import deputiesPage from "./fixtures/deputados-pagina.json";
import history from "./fixtures/historico-178882.json";
import votes from "./fixtures/votacoes-amostra.json";
import ballots from "./fixtures/votacoesVotos-amostra.json";

const clone = <T>(value: T): T => structuredClone(value);

describe("esquemas de entrada (amostras reais da Câmara)", () => {
  it("aceitam a página de deputados da API", () => {
    const parsed = parseOrThrow(camaraDeputyListPageSchema, deputiesPage, "deputados");
    expect(parsed.dados.length).toBeGreaterThan(0);
    expect(typeof parsed.dados[0]?.id).toBe("number");
  });

  it("aceitam o histórico de um deputado", () => {
    const parsed = parseOrThrow(camaraHistoryResponseSchema, history, "histórico");
    expect(parsed.dados.some((event) => event.situacao === "Licença")).toBe(true);
  });

  it("aceitam o arquivo de votações, inclusive dataHoraRegistro vazio", () => {
    const parsed = parseOrThrow(camaraVotesFileSchema, votes, "votações");
    expect(parsed.dados.some((vote) => vote.dataHoraRegistro === "")).toBe(true);
  });

  it("aceitam o arquivo de votos com os cinco tipos de voto", () => {
    const parsed = parseOrThrow(camaraBallotsFileSchema, ballots, "votos");
    expect(new Set(parsed.dados.map((ballot) => ballot.voto))).toEqual(
      new Set(["Sim", "Não", "Abstenção", "Obstrução", "Artigo 17"]),
    );
  });

  it("ignoram campos extras", () => {
    const data = clone(deputiesPage);
    (data.dados[0] as Record<string, unknown>).campoNovo = "x";
    expect(() => parseOrThrow(camaraDeputyListPageSchema, data, "deputados")).not.toThrow();
  });
});

describe("esquemas de entrada rejeitam dado diferente do esperado", () => {
  it("falha com mensagem clara quando falta um campo", () => {
    const data = clone(deputiesPage);
    delete (data.dados[0] as Partial<(typeof data.dados)[0]>).siglaUf;
    expect(() => parseOrThrow(camaraDeputyListPageSchema, data, "deputados")).toThrowError(
      /Dados inválidos em deputados:\n {2}- dados\[0\]\.siglaUf/,
    );
  });

  it("falha quando o id muda de tipo", () => {
    const data = clone(deputiesPage);
    (data.dados[0] as Record<string, unknown>).id = "204379";
    expect(() => parseOrThrow(camaraDeputyListPageSchema, data, "deputados")).toThrow(
      DataValidationError,
    );
  });

  it("falha quando aparece um tipo de voto desconhecido", () => {
    const data = clone(ballots);
    (data.dados[0] as Record<string, unknown>).voto = "Talvez";
    expect(() => parseOrThrow(camaraBallotsFileSchema, data, "votos")).toThrowError(
      /dados\[0\]\.voto/,
    );
  });

  it("falha quando o formato da data muda", () => {
    const data = clone(votes);
    (data.dados[0] as Record<string, unknown>).data = "14/03/2023";
    expect(() => parseOrThrow(camaraVotesFileSchema, data, "votações")).toThrowError(
      /dados\[0\]\.data/,
    );
  });
});

describe("esquemas de saída", () => {
  it("aceitam um deputados.json válido", () => {
    const file = {
      schemaVersion: 1,
      legislatureId: 57,
      deputies: [
        {
          id: 1,
          name: "Fulana de Tal",
          party: "ABC",
          state: "SP",
          photoUrl: "https://www.camara.leg.br/internet/deputado/bandep/1.jpg",
          profileUrl: "https://www.camara.leg.br/deputados/1",
          status: "Em exercício",
          electoralCondition: "Titular",
          inServiceSince: "2023-02-01T12:05:00",
        },
      ],
    };
    expect(() => parseOrThrow(deputiesFileSchema, file, "deputados.json")).not.toThrow();
  });

  it("rejeitam taxa de participação fora de 0 a 1", () => {
    const file = {
      schemaVersion: 1,
      legislatureId: 57,
      referenceDateTime: "2026-10-22T03:00:00",
      nominalPlenaryVotes: 10,
      lastVoteDate: "2026-10-21",
      deputies: [
        {
          deputyId: 1,
          eligibleVotes: 10,
          ballotsCast: 11,
          rate: 1.1,
          breakdown: { yes: 11, no: 0, abstention: 0, obstruction: 0, article17: 0, secret: 0 },
          ballotsOutsideServicePeriods: 0,
          servicePeriods: [{ start: "2023-02-01T12:05:00", end: null }],
        },
      ],
    };
    expect(() => parseOrThrow(participationFileSchema, file, "participacao.json")).toThrowError(
      /deputies\[0\]\.rate/,
    );
  });
});
