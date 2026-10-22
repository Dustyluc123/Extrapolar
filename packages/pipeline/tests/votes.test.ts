import type { CamaraBallot, CamaraVote } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import { QualityLog } from "../src/normalize/quality";
import { selectNominalPlenaryVotes } from "../src/normalize/votes";

function vote(id: string, dataHoraRegistro: string, extra: Partial<CamaraVote> = {}): CamaraVote {
  return {
    id,
    data: dataHoraRegistro.slice(0, 10) || "2024-03-01",
    dataHoraRegistro,
    idOrgao: 180,
    siglaOrgao: "PLEN",
    votosSim: 1,
    votosNao: 0,
    votosOutros: 0,
    descricao: "",
    ...extra,
  };
}

function ballot(
  idVotacao: string,
  deputyId: number,
  voto: CamaraBallot["voto"] = "Sim",
): CamaraBallot {
  return {
    idVotacao,
    dataHoraVoto: "2024-03-01T15:00:10",
    voto,
    deputado_: {
      id: String(deputyId),
      nome: "x",
      siglaPartido: "ABC",
      siglaUf: "SP",
      idLegislatura: "57",
    },
  };
}

const BASE = {
  start: "2023-02-01T00:00:00",
  end: "2027-01-31T23:59:59",
  referenceDateTime: "2026-10-22T00:00:00",
};

describe("selectNominalPlenaryVotes", () => {
  it("fica só com votações de plenário que têm votos individuais, dentro da legislatura", () => {
    const quality = new QualityLog();
    const result = selectNominalPlenaryVotes({
      ...BASE,
      quality,
      votes: [
        vote("nominal", "2024-03-01T15:00:00"),
        vote("simbolica", "2024-03-01T16:00:00"),
        vote("comissao", "2024-03-01T17:00:00", { siglaOrgao: "CCJC" }),
        vote("legislatura-anterior", "2023-01-10T15:00:00"),
        vote("futura", "2026-11-01T15:00:00"),
      ],
      ballots: [
        ballot("nominal", 1, "Sim"),
        ballot("nominal", 2, "Obstrução"),
        ballot("comissao", 1),
        ballot("legislatura-anterior", 1),
        ballot("futura", 1),
      ],
    });
    expect(result.votes).toEqual([{ id: "nominal", dateTime: "2024-03-01T15:00:00" }]);
    expect(result.ballots).toEqual([
      { voteId: "nominal", deputyId: 1, value: "yes", party: "ABC" },
      { voteId: "nominal", deputyId: 2, value: "obstruction", party: "ABC" },
    ]);
    expect(quality.list()).toEqual([]);
  });

  it("sem horário de registro usa o primeiro voto e registra aviso", () => {
    const quality = new QualityLog();
    const result = selectNominalPlenaryVotes({
      ...BASE,
      quality,
      votes: [vote("v1", "", { data: "2024-03-01" })],
      ballots: [ballot("v1", 1)],
    });
    expect(result.votes[0]?.dateTime).toBe("2024-03-01T15:00:10");
    expect(quality.list()[0]?.code).toBe("votacao-sem-horario");
  });

  it("voto vazio em votação secreta conta como voto secreto", () => {
    const result = selectNominalPlenaryVotes({
      ...BASE,
      quality: new QualityLog(),
      votes: [
        vote("secreta", "2025-10-29T12:05:36", {
          ultimaAberturaVotacao: { descricao: "Votação secreta em turno único." },
        }),
      ],
      ballots: [ballot("secreta", 1, "")],
    });
    expect(result.ballots).toEqual([
      { voteId: "secreta", deputyId: 1, value: "secret", party: "ABC" },
    ]);
  });

  it("voto vazio em votação não secreta faz o pipeline falhar", () => {
    expect(() =>
      selectNominalPlenaryVotes({
        ...BASE,
        quality: new QualityLog(),
        votes: [vote("aberta", "2025-10-29T12:05:36")],
        ballots: [ballot("aberta", 1, "")],
      }),
    ).toThrow(/não está marcada como secreta/);
  });

  it("voto duplicado do mesmo deputado conta uma vez e gera aviso", () => {
    const quality = new QualityLog();
    const result = selectNominalPlenaryVotes({
      ...BASE,
      quality,
      votes: [vote("v1", "2024-03-01T15:00:00")],
      ballots: [ballot("v1", 1, "Sim"), ballot("v1", 1, "Não")],
    });
    expect(result.ballots).toHaveLength(1);
    expect(quality.list()[0]?.code).toBe("voto-duplicado");
  });
});
