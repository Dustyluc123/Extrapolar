// Fiscalização do Executivo e sugestões ao governo (Caderno 4): funções puras.
// Regras em docs/METODOLOGIA.md (#ric, #pfc, #convocacoes, #indicacoes).
import type { PropositionRole } from "./propositions";

export interface OversightProposition {
  type: string;
  codType: number;
  /** AAAA-MM-DD */
  date: string;
  role: PropositionRole;
}

export interface AuthorCount {
  first: number;
  coauthor: number;
}

export interface OversightSummary {
  ric: AuthorCount;
  pfc: AuthorCount;
  convocations: AuthorCount & { byCode: { code: number; first: number; coauthor: number }[] };
  indications: AuthorCount;
  /** RIC + PFC como autor principal, por trimestre ("2023-T1"). */
  byQuarter: { quarter: string; count: number }[];
}

export function quarterOf(date: string): string {
  const month = Number(date.slice(5, 7));
  return `${date.slice(0, 4)}-T${Math.ceil(month / 3)}`;
}

/** Trimestres de `from` até `to` (inclusive), ex.: 2023-02-01 → 2023-T1. */
export function quartersBetween(from: string, to: string): string[] {
  const quarters: string[] = [];
  let year = Number(from.slice(0, 4));
  let q = Math.ceil(Number(from.slice(5, 7)) / 3);
  const end = quarterOf(to);
  for (;;) {
    const key = `${year}-T${q}`;
    quarters.push(key);
    if (key === end) return quarters;
    q++;
    if (q > 4) {
      q = 1;
      year++;
    }
    if (year > 3000) throw new Error(`Intervalo de trimestres inválido: ${from} a ${to}`);
  }
}

const empty = (): AuthorCount => ({ first: 0, coauthor: 0 });

function add(count: AuthorCount, role: PropositionRole) {
  if (role === "first") count.first++;
  else if (role === "coauthor") count.coauthor++;
}

export function summarizeOversight(
  propositions: readonly OversightProposition[],
  convocationCodes: readonly number[],
  quarters: readonly string[],
): OversightSummary {
  const ric = empty();
  const pfc = empty();
  const indications = empty();
  const convocations = empty();
  const byCode = new Map<number, AuthorCount>(convocationCodes.map((code) => [code, empty()]));
  const byQuarter = new Map<string, number>(quarters.map((quarter) => [quarter, 0]));

  for (const p of propositions) {
    if (p.role === "support") continue;
    if (p.type === "RIC" || p.type === "PFC") {
      add(p.type === "RIC" ? ric : pfc, p.role);
      if (p.role === "first") {
        const quarter = quarterOf(p.date);
        if (byQuarter.has(quarter)) byQuarter.set(quarter, (byQuarter.get(quarter) ?? 0) + 1);
      }
    } else if (p.type === "INC") {
      add(indications, p.role);
    } else if (p.type === "REQ" && byCode.has(p.codType)) {
      add(convocations, p.role);
      add(byCode.get(p.codType) as AuthorCount, p.role);
    }
  }
  return {
    ric,
    pfc,
    indications,
    convocations: {
      ...convocations,
      byCode: [...byCode.entries()].map(([code, c]) => ({ code, ...c })),
    },
    byQuarter: [...byQuarter.entries()].map(([quarter, count]) => ({ quarter, count })),
  };
}
