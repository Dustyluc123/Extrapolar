// Caderno 4 — Fiscalização do Executivo: RIC, PFC, convocações e indicações.
import type { Fiscalizacao } from "@extrapolar/shared";
import {
  quartersBetween,
  summarizeOversight,
  type OversightProposition,
} from "@extrapolar/metrics";
import { CONVOCATION_REQUEST_CODES } from "../../normalize/propositions";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";
import { propositionsByDeputy } from "./projetos";

export function computeFiscalizacao(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Fiscalizacao> {
  const quarters = quartersBetween(
    context.legislature.start,
    context.referenceDateTime.slice(0, 10),
  );
  const codes = [...CONVOCATION_REQUEST_CODES.keys()];
  const byDeputy = propositionsByDeputy(data);
  const result = new Map<number, Fiscalizacao>();
  for (const deputy of data.deputies) {
    const list: OversightProposition[] = (byDeputy.get(deputy.id) ?? []).map(
      ({ proposition, role }) => ({
        type: proposition.type,
        codType: proposition.codType,
        date: proposition.date,
        role,
      }),
    );
    const s = summarizeOversight(list, codes, quarters);
    const pair = (c: { first: number; coauthor: number }) => ({
      autorPrincipal: c.first,
      coautor: c.coauthor,
    });
    result.set(deputy.id, {
      ric: pair(s.ric),
      pfc: pair(s.pfc),
      convocacoes: {
        ...pair(s.convocations),
        porTipo: s.convocations.byCode.map((c) => ({
          tipo: CONVOCATION_REQUEST_CODES.get(c.code) ?? String(c.code),
          ...pair(c),
        })),
      },
      indicacoes: pair(s.indications),
      porTrimestre: s.byQuarter.map((q) => ({ trimestre: q.quarter, quantidade: q.count })),
    });
  }
  return result;
}
