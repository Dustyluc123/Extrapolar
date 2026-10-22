// Caderno 5 — Voz: discursos por ano, fase da sessão e tipo.
import { legislatureYears, type Voz } from "@extrapolar/shared";
import { summarizeDiscourses } from "@extrapolar/metrics";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

export function computeVoz(context: PipelineContext, data: NormalizedData): Map<number, Voz> {
  const years = legislatureYears(context.legislature, context.referenceDateTime);
  const result = new Map<number, Voz>();
  for (const deputy of data.deputies) {
    const entry = data.discourses.get(deputy.id);
    if (!entry) throw new Error(`Discursos não baixados para o deputado ${deputy.id}.`);
    const s = summarizeDiscourses(entry.items, years, context.legislature.start);
    result.set(deputy.id, {
      total: s.total,
      porAno: s.byYear.map((y) => ({ ano: y.year, quantidade: y.count })),
      porFase: s.byPhase.map((p) => ({ fase: p.phase, quantidade: p.count })),
      porTipo: s.byType.map((t) => ({ tipo: t.type, quantidade: t.count })),
      ultimoDiscurso: s.last,
      mesesIndisponiveis: entry.unavailableMonths,
      consultadoEm: entry.consultedAt,
    });
  }
  return result;
}
