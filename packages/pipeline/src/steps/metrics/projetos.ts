// Caderno 3 — Projetos e leis: proposições por tipo, situação, temas e pareceres de relator.
import { idFromUri, legislatureYears, type Projetos } from "@extrapolar/shared";
import {
  isKnownSituation,
  isMainType,
  summarizeOpinions,
  summarizePropositions,
  type AuthoredProposition,
  type PropositionRole,
} from "@extrapolar/metrics";
import type { CompactProposition } from "../../normalize/propositions";
import { OPINION_TYPES } from "../../normalize/propositions";
import type { PipelineContext } from "../context";
import type { NormalizedData } from "../normalize";

/** Proposições de cada deputado com o papel dele (autor principal, coautor, apoio). */
export function propositionsByDeputy(
  data: NormalizedData,
): Map<number, { proposition: CompactProposition; role: PropositionRole }[]> {
  const result = new Map<number, { proposition: CompactProposition; role: PropositionRole }[]>();
  for (const proposition of data.propositions.propositions.values()) {
    for (const author of data.authorship.get(proposition.id) ?? []) {
      const role: PropositionRole = !author.proponent
        ? "support"
        : author.order === 1
          ? "first"
          : "coauthor";
      const list = result.get(author.deputyId) ?? [];
      list.push({ proposition, role });
      result.set(author.deputyId, list);
    }
  }
  return result;
}

export function computeProjetos(
  context: PipelineContext,
  data: NormalizedData,
): Map<number, Projetos> {
  const years = legislatureYears(context.legislature, context.referenceDateTime);
  const byDeputy = propositionsByDeputy(data);
  const organNames = new Map(data.organs.map((o) => [idFromUri(o.uri), o]));

  const unknownSituations = new Map<string, number>();
  const result = new Map<number, Projetos>();
  for (const deputy of data.deputies) {
    const list = byDeputy.get(deputy.id) ?? [];
    const authored: AuthoredProposition[] = list.map(({ proposition, role }) => ({
      id: proposition.id,
      type: proposition.type,
      date: proposition.date,
      situationId: proposition.situationId,
      themes: data.propositionThemes.get(proposition.id) ?? [],
      role,
    }));
    const summary = summarizePropositions(authored, years);
    for (const p of authored) {
      if (p.role !== "first" || !isMainType(p.type)) continue;
      if (!isKnownSituation(p.situationId)) {
        unknownSituations.set(p.situationId, (unknownSituations.get(p.situationId) ?? 0) + 1);
      }
    }

    const opinions = list
      .filter(({ proposition, role }) => role === "first" && OPINION_TYPES.has(proposition.type))
      .map(({ proposition }) => ({
        date: proposition.date,
        organ: organNames.get(proposition.organId)?.sigla ?? String(proposition.organId),
      }));
    const opinionSummary = summarizeOpinions(opinions, years);
    const siglaToName = new Map(
      [...organNames.values()].map((o) => [o.sigla, o.apelido || o.nome] as const),
    );

    const typeCounts = data.propositions.typeCounts.get(deputy.id) ?? new Map();
    result.set(deputy.id, {
      porTipo: summary.byType.map((t) => ({
        tipo: t.type,
        autorPrincipal: t.first,
        coautor: t.coauthor,
      })),
      porAno: summary.byYear.map((y) => ({ ano: y.year, autorPrincipal: y.first })),
      autorPrincipal: summary.totalFirst,
      coautor: summary.totalCoauthor,
      apoio: summary.totalSupport,
      todosOsTipos: [...typeCounts.values()]
        .map((c) => ({ tipo: c.sigla, nome: c.name, autorPrincipal: c.first, coautor: c.coauthor }))
        .sort(
          (a, b) =>
            b.autorPrincipal + b.coautor - (a.autorPrincipal + a.coautor) ||
            a.tipo.localeCompare(b.tipo),
        ),
      situacao: {
        categorias: summary.situations.map((s) => ({ categoria: s.category, quantidade: s.count })),
        viraramNorma: summary.becameLaw,
        taxaConversao: summary.conversionRate,
      },
      temas: {
        comTema: summary.withTheme,
        homenagens: summary.homage,
        porTema: summary.themes.map((t) => ({
          codigo: t.code,
          nome: data.themeNames.get(t.code) ?? `Tema ${t.code}`,
          quantidade: t.count,
        })),
      },
      pareceres: {
        total: opinionSummary.total,
        porAno: opinionSummary.byYear.map((y) => ({ ano: y.year, quantidade: y.count })),
        porOrgao: opinionSummary.byOrgan.map((o) => ({
          sigla: o.organ,
          nome: siglaToName.get(o.organ) ?? o.organ,
          quantidade: o.count,
        })),
      },
    });
  }
  for (const [id, n] of unknownSituations) {
    context.quality.add(
      `situacao-desconhecida-${id || "vazia"}`,
      `Situação de proposição com código ${id} não classificada (aparece como "outra situação").`,
      n,
    );
  }
  return result;
}
