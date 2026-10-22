// Caderno 6 — Dinheiro público: cota parlamentar, equipe do gabinete e emendas.
import { ceapCeilingFor, type Dinheiro } from "@extrapolar/shared";
import {
  monthsBetween,
  monthsInService,
  summarizeAmendments,
  summarizeCeap,
} from "@extrapolar/metrics";
import { toBrasiliaLocalDateTime } from "../../lib/time";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

export function computeDinheiro(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Dinheiro> {
  const { legislature, referenceDateTime } = context;
  const months = monthsBetween(legislature.start, referenceDateTime.slice(0, 10));
  const currentMonth = referenceDateTime.slice(0, 7);
  const staffDate = data.staff.lastModified
    ? toBrasiliaLocalDateTime(new Date(data.staff.lastModified)).slice(0, 10)
    : null;

  const result = new Map<number, Dinheiro>();
  for (const deputy of data.deputies) {
    const ceap = data.ceap.get(deputy.id) ?? { entries: [], restitutions: 0 };
    const c = summarizeCeap({
      entries: ceap.entries,
      months,
      serviceMonths: monthsInService(
        data.servicePeriods.get(deputy.id) ?? [],
        legislature.start,
        referenceDateTime,
      ),
      // O mês corrente fica fora da comparação com o teto: ainda está incompleto (notas chegam
      // até 90 dias depois).
      ceilingFor: (month) => (month >= currentMonth ? null : ceapCeilingFor(month, deputy.state)),
    });

    const link = data.amendmentLinks.links.get(deputy.id) ?? null;
    const a = summarizeAmendments(
      link ? (data.amendmentsByAuthor.get(link.code) ?? []) : [],
      data.amendmentYears,
    );
    const values = (v: {
      committed: number;
      liquidated: number;
      paid: number;
      carriedPaid: number;
    }) => ({
      empenhado: v.committed,
      liquidado: v.liquidated,
      pago: v.paid,
      restosPagos: v.carriedPaid,
    });

    const staff = data.staff.counts.get(deputy.id) ?? 0;
    result.set(deputy.id, {
      cota: {
        total: c.total,
        porAno: c.byYear.map((y) => ({ ano: y.year, valor: y.value })),
        porMes: c.byMonth.map((m) => ({ mes: m.month, valor: m.value })),
        porCategoria: c.byCategory.map((x) => ({ categoria: x.category, valor: x.value })),
        restituicoes: Math.round(ceap.restitutions * 100) / 100,
        teto: c.ceilingByYear.map((y) => ({
          ano: y.year,
          meses: y.months,
          gasto: y.spent,
          limite: y.ceiling,
          proporcao: y.share,
        })),
      },
      equipe: { secretarios: staff > 0 ? staff : null, dataArquivo: staffDate },
      emendas: {
        autor: link ? { codigo: link.code, nome: link.name, ligacao: link.via } : null,
        porAno: a.byYear.map((y) => ({ ano: y.year, ...values(y) })),
        total: values(a.total),
        execucao: a.execution,
        porTipo: a.byType.map((t) => ({ tipo: t.type, ...values(t) })),
        destinos: a.topLocations.map((l) => ({ local: l.location, empenhado: l.committed })),
      },
    });
  }
  return result;
}
