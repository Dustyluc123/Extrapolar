import type { CamaraEvent } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import { selectPlenarySessions } from "../src/normalize/sessions";

function ev(id: number, dataHoraInicio: string, extra: Partial<CamaraEvent> = {}): CamaraEvent {
  return {
    id,
    dataHoraInicio,
    situacao: "Encerrada",
    descricaoTipo: "Sessão Deliberativa",
    descricao: "",
    ...extra,
  };
}

describe("selectPlenarySessions", () => {
  it("fica só com sessões deliberativas encerradas do plenário, na legislatura", () => {
    const result = selectPlenarySessions({
      events: [
        ev(1, "2024-03-05T14:00:00"),
        ev(2, "2024-03-06T14:00:00", { situacao: "Encerrada (Final)" }),
        ev(3, "2024-03-07T14:00:00", { situacao: "Cancelada" }),
        ev(4, "2024-03-08T10:00:00", { descricaoTipo: "Sessão Não Deliberativa Solene" }),
        ev(5, "2024-03-09T10:00:00"), // de comissão
        ev(6, "2023-01-20T10:00:00"), // legislatura anterior
        ev(7, "2026-11-01T10:00:00"), // depois da referência
      ],
      eventOrgans: [1, 2, 3, 4, 6, 7]
        .map((id) => ({ idEvento: id, idOrgao: 180, siglaOrgao: "PLEN" }))
        .concat([{ idEvento: 5, idOrgao: 2003, siglaOrgao: "CCJC" }]),
      presences: [
        { idEvento: 1, idDeputado: 10 },
        { idEvento: 2, idDeputado: 10 },
        { idEvento: 4, idDeputado: 10 },
        { idEvento: 5, idDeputado: 10 },
      ],
      start: "2023-02-01T00:00:00",
      end: "2027-01-31T23:59:59",
      referenceDateTime: "2026-10-22T00:00:00",
    });
    expect(result.sessions.map((s) => s.id)).toEqual([1, 2]);
    expect([...(result.presencesByDeputy.get(10) ?? [])].sort()).toEqual([1, 2]);
  });
});
