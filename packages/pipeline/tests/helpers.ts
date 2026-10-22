import type { CamaraHistoryEvent } from "@extrapolar/shared";

/** Evento de histórico mínimo para testes. */
export function event(
  dataHora: string,
  situacao: string | null,
  extra: Partial<CamaraHistoryEvent> = {},
): CamaraHistoryEvent {
  return {
    id: 1,
    idLegislatura: 57,
    dataHora,
    situacao,
    condicaoEleitoral: situacao ? "Titular" : null,
    descricaoStatus: null,
    siglaPartido: "ABC",
    siglaUf: "SP",
    ...extra,
  };
}
