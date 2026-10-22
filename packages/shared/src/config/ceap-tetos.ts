// Teto mensal da Cota para o Exercício da Atividade Parlamentar (CEAP) por UF.
// O valor varia por estado por causa do preço das passagens aéreas de Brasília até a capital.
// Princípio 3 do CLAUDE.md: nada de memória. Período sem tabela oficial encontrada = null.
// Ver docs/decisoes/0017-teto-da-cota.md e docs/FONTES.md.

export type UF =
  | "AC"
  | "AL"
  | "AM"
  | "AP"
  | "BA"
  | "CE"
  | "DF"
  | "ES"
  | "GO"
  | "MA"
  | "MG"
  | "MS"
  | "MT"
  | "PA"
  | "PB"
  | "PE"
  | "PI"
  | "PR"
  | "RJ"
  | "RN"
  | "RO"
  | "RR"
  | "RS"
  | "SC"
  | "SE"
  | "SP"
  | "TO";

export interface CeapCeilingPeriod {
  /** Primeiro mês de competência (AAAA-MM). */
  start: string;
  /** Último mês de competência (AAAA-MM), ou null se ainda vigente. */
  end: string | null;
  /** Valores mensais em reais por UF; null quando a tabela oficial não foi encontrada. */
  values: Record<UF, number> | null;
  source: { name: string; url: string; checkedAt: string } | null;
  /** Ato normativo de referência. */
  legalBasis: string;
  pending: string | null;
}

export const CEAP_CEILINGS: CeapCeilingPeriod[] = [
  {
    start: "2023-02",
    end: "2026-02",
    // TODO: conferir na fonte oficial: https://www2.camara.leg.br/legin/int/atomes/2026/atodamesa-244-20-fevereiro-2026-798720-norma-cd-mesa.html
    // (o Ato 244/2026 diz que o reajuste anterior foi em fevereiro de 2023; falta achar a tabela
    // oficial que vigorou de fev/2023 até a publicação do Ato 244/2026). Fevereiro de 2026 também
    // fica null: o Ato 244/2026 entrou em vigor no dia 20 e não está claro qual tabela vale para o mês.
    values: null,
    source: null,
    legalBasis: "Anexo Único do Ato da Mesa nº 43/2009, com o reajuste de fevereiro de 2023",
    pending: "Tabela oficial vigente de fevereiro de 2023 a fevereiro de 2026 não encontrada.",
  },
  {
    start: "2026-03",
    end: null,
    values: {
      AC: 57359.87,
      AL: 53164.36,
      AM: 56151.46,
      AP: 55929.26,
      BA: 50965.29,
      CE: 54879.34,
      DF: 41612.55,
      ES: 49160.15,
      GO: 46979.73,
      MA: 54537.99,
      MG: 47645.91,
      MS: 52707.93,
      MT: 51439.83,
      PA: 54624.17,
      PB: 54402.48,
      PE: 53997.81,
      PI: 53195.84,
      PR: 50807.19,
      RJ: 47267.41,
      RN: 55198.09,
      RO: 56267.9,
      RR: 58474.7,
      RS: 53086.78,
      SC: 51951.42,
      SE: 52248.86,
      SP: 48727.46,
      TO: 51525.8,
    },
    source: {
      name: 'Câmara dos Deputados — Cota Parlamentar (guia para jornalistas), "valores atuais"',
      url: "https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/cota-parlamentar",
      checkedAt: "2026-10-22",
    },
    legalBasis:
      "Ato da Mesa nº 244/2026 (em vigor desde 20/02/2026), que atualiza o Anexo Único do Ato da Mesa nº 43/2009",
    // TODO: conferir na fonte oficial: Diário da Câmara dos Deputados de 20/02/2026, página 2216
    // (publicação do Ato da Mesa nº 244/2026). A página oficial não informa a data da tabela.
    pending: "Conferir os valores no Diário da Câmara de 20/02/2026, p. 2216.",
  },
];

/** Teto mensal oficial para o mês (AAAA-MM) e a UF, ou null se não houver tabela oficial. */
export function ceapCeilingFor(month: string, uf: string): number | null {
  const period = CEAP_CEILINGS.find((p) => p.start <= month && (p.end === null || month <= p.end));
  if (!period?.values) return null;
  return period.values[uf as UF] ?? null;
}
