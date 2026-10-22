// Caderno 7 — Articulação e perfil: frentes, cargos (Mesa, órgãos, lideranças) e perfil.
import type { Articulacao } from "@extrapolar/shared";
import { rolesInPeriod, summarizeFronts } from "@extrapolar/metrics";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

/** Cargos de membro comum: não entram em "cargos". */
const PLAIN_MEMBER = new Set(["Titular", "Suplente"]);

export function computeArticulacao(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Articulacao> {
  const from = context.legislature.start;
  const to = context.referenceDateTime.slice(0, 10);
  const a = data.articulation;
  const result = new Map<number, Articulacao>();
  for (const deputy of data.deputies) {
    const fronts = summarizeFronts(a.frontMemberships.get(deputy.id) ?? []);
    const organs = data.organsByDeputy.get(deputy.id)?.memberships ?? [];
    result.set(deputy.id, {
      frentes: { total: fronts.total, coordena: fronts.coordinated, todas: fronts.all },
      cargos: {
        mesa: rolesInPeriod(a.board.get(deputy.id) ?? [], from, to).map((r) => ({
          cargo: r.cargo,
          inicio: r.start,
          fim: r.end !== null && r.end > to ? null : r.end,
        })),
        orgaos: rolesInPeriod(
          organs
            .filter((m) => !PLAIN_MEMBER.has(m.cargo) && m.sigla !== "MESA")
            .map((m) => ({ ...m, start: m.inicio, end: m.fim })),
          from,
          to,
        ).map((m) => ({
          sigla: m.sigla,
          nome: m.nome,
          cargo: m.cargo,
          inicio: m.inicio,
          fim: m.fim,
        })),
        liderancas: rolesInPeriod(
          (a.leaders.get(deputy.id) ?? []).map((l) => ({
            ...l,
            start: l.dataInicio,
            end: l.dataFim,
          })),
          from,
          to,
        ).map((l) => ({
          titulo: l.titulo,
          bancada: l.bancada.nome,
          tipo: l.bancada.tipo,
          inicio: l.dataInicio,
          fim: l.dataFim !== null && l.dataFim > to ? null : l.dataFim,
        })),
      },
      perfil: {
        profissoes: a.professions.get(deputy.id) ?? [],
        ocupacoes: a.occupations.get(deputy.id) ?? [],
      },
    });
  }
  return result;
}
