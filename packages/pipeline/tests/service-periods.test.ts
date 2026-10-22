import { camaraHistoryResponseSchema } from "@extrapolar/shared";
import { describe, expect, it } from "vitest";
import { buildServicePeriods } from "../src/normalize/service-periods";
import history from "./fixtures/historico-178882.json";
import { event } from "./helpers";

const REF = "2026-10-22T00:00:00";

describe("buildServicePeriods", () => {
  it("titular sem licença tem um período aberto desde a posse", () => {
    const periods = buildServicePeriods(
      [
        event("2023-02-01T00:00", null),
        event("2023-02-01T12:05", "Exercício"),
        event("2024-05-01T10:00", "Exercício", { descricaoStatus: "Alteração de partido" }),
      ],
      57,
      REF,
    );
    expect(periods).toEqual([{ start: "2023-02-01T12:05:00", end: null }]);
  });

  it("licença fecha o período e reassunção abre outro", () => {
    const periods = buildServicePeriods(
      [
        event("2023-02-01T12:05", "Exercício"),
        event("2023-09-13T14:53", "Licença"),
        event("2024-12-03T10:11", "Exercício"),
      ],
      57,
      REF,
    );
    expect(periods).toEqual([
      { start: "2023-02-01T12:05:00", end: "2023-09-13T14:53:00" },
      { start: "2024-12-03T10:11:00", end: null },
    ]);
  });

  it("aceita eventos fora de ordem e grafias diferentes (CONVOCADO, SUPLENCIA)", () => {
    const periods = buildServicePeriods(
      [
        event("2023-11-17T10:25", "SUPLENCIA"),
        event("2023-02-08T14:03", "Exercício"),
        event("2023-02-08T12:30", "CONVOCADO"),
        event("2023-12-06T17:20", "EXERCICIO"),
      ],
      57,
      REF,
    );
    expect(periods).toEqual([
      { start: "2023-02-08T14:03:00", end: "2023-11-17T10:25:00" },
      { start: "2023-12-06T17:20:00", end: null },
    ]);
  });

  it("em empate de horário, fecha antes de abrir", () => {
    const periods = buildServicePeriods(
      [
        event("2023-02-01T12:00", "Exercício"),
        event("2023-12-06T17:20", "Exercício"),
        event("2023-12-06T17:20", "CONVOCADO"),
      ],
      57,
      REF,
    );
    expect(periods).toEqual([
      { start: "2023-02-01T12:00:00", end: "2023-12-06T17:20:00" },
      { start: "2023-12-06T17:20:00", end: null },
    ]);
  });

  it("ignora outras legislaturas e eventos depois da data de referência", () => {
    const periods = buildServicePeriods(
      [
        event("2019-02-01T11:45", "Exercício", { idLegislatura: 56 }),
        event("2023-01-31T23:59", "FIM_MANDATO", { idLegislatura: 56 }),
        event("2023-02-01T12:05", "Exercício"),
        event("2026-11-01T10:00", "Licença"),
      ],
      57,
      REF,
    );
    expect(periods).toEqual([{ start: "2023-02-01T12:05:00", end: null }]);
  });

  it("sem evento de exercício não há período", () => {
    expect(buildServicePeriods([event("2023-02-03T09:34", "CONVOCADO")], 57, REF)).toEqual([]);
  });

  it("monta os períodos de um ministro licenciado (histórico real)", () => {
    const events = camaraHistoryResponseSchema.parse(history).dados;
    const periods = buildServicePeriods(events, 57, REF);
    expect(periods[0]).toEqual({ start: "2023-02-01T12:05:00", end: "2023-09-13T14:53:00" });
    expect(periods.at(-1)?.end).toBeNull();
    expect(periods.length).toBeGreaterThan(3);
  });
});
