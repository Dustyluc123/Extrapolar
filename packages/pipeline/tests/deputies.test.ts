import { getLegislature, type CamaraDeputyListItem } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import { latestElectoralCondition, normalizeDeputies } from "../src/normalize/deputies";
import { QualityLog } from "../src/normalize/quality";
import { event } from "./helpers";

const REF = "2026-10-22T00:00:00";
const L57 = getLegislature(57);

function item(id: number, nome: string, extra: Partial<CamaraDeputyListItem> = {}) {
  return {
    id,
    nome,
    siglaPartido: "ABC",
    siglaUf: "sp",
    idLegislatura: 57,
    urlFoto: `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`,
    email: null,
    ...extra,
  };
}

describe("normalizeDeputies", () => {
  it("converte para o formato de saída e ordena por nome (com acentos)", () => {
    const quality = new QualityLog();
    const deputies = normalizeDeputies(
      [
        { item: item(2, "Zélia "), history: [event("2023-02-01T12:05", "Exercício")] },
        { item: item(1, "Átila"), history: [event("2023-02-01T12:05", "Exercício")] },
        { item: item(3, "Bruno"), history: [event("2023-02-01T12:05", "Exercício")] },
      ],
      L57,
      REF,
      quality,
    );
    expect(deputies.map((d) => d.name)).toEqual(["Átila", "Bruno", "Zélia"]);
    expect(deputies[0]).toEqual({
      id: 1,
      name: "Átila",
      party: "ABC",
      state: "SP",
      photoUrl: "https://www.camara.leg.br/internet/deputado/bandep/1.jpg",
      profileUrl: "https://www.camara.leg.br/deputados/1",
      status: "Em exercício",
      electoralCondition: "Titular",
      inServiceSince: "2023-02-01T12:05:00",
    });
    expect(quality.list()).toEqual([]);
  });

  it("registra aviso quando o histórico não tem período aberto", () => {
    const quality = new QualityLog();
    const [deputy] = normalizeDeputies(
      [{ item: item(1, "Ana"), history: [event("2023-02-01T12:05", "CONVOCADO")] }],
      L57,
      REF,
      quality,
    );
    expect(deputy?.inServiceSince).toBeNull();
    expect(quality.list()[0]?.code).toBe("em-exercicio-sem-periodo-aberto");
  });

  it("falha com mensagem clara se a legislatura não bate", () => {
    expect(() =>
      normalizeDeputies(
        [{ item: item(1, "Ana", { idLegislatura: 58 }), history: [] }],
        L57,
        REF,
        new QualityLog(),
      ),
    ).toThrow(/CURRENT_LEGISLATURE_ID/);
  });
});

describe("latestElectoralCondition", () => {
  it("usa a condição mais recente e traduz EFETIVADO", () => {
    const quality = new QualityLog();
    const condition = latestElectoralCondition(
      [
        event("2023-02-08T14:03", "Exercício", { condicaoEleitoral: "Suplente" }),
        event("2025-12-23T15:01", "Exercício", { condicaoEleitoral: "EFETIVADO" }),
      ],
      57,
      quality,
    );
    expect(condition).toBe("Suplente efetivado");
  });

  it("valor desconhecido vira null e gera aviso", () => {
    const quality = new QualityLog();
    const condition = latestElectoralCondition(
      [event("2023-02-08T14:03", "Exercício", { condicaoEleitoral: "Outra coisa" })],
      57,
      quality,
    );
    expect(condition).toBeNull();
    expect(quality.list()[0]?.code).toBe("condicao-eleitoral-desconhecida");
  });
});
