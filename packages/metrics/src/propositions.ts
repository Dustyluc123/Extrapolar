// Projetos e leis (Caderno 3): funções puras sobre as proposições de um deputado.
// Regras em docs/METODOLOGIA.md (#proposicoes, #situacao-proposicoes, #temas, #pareceres).
import { safeRatio } from "./ratio";

/** Tipos que podem virar norma e são de iniciativa de deputados. */
export const MAIN_PROPOSITION_TYPES = ["PL", "PLP", "PEC", "PDL", "PRC"] as const;
export type MainPropositionType = (typeof MAIN_PROPOSITION_TYPES)[number];

export function isMainType(type: string): type is MainPropositionType {
  return (MAIN_PROPOSITION_TYPES as readonly string[]).includes(type);
}

/** Tema oficial "Homenagens e Datas Comemorativas" (lista /referencias/proposicoes/codTema). */
export const HOMAGE_THEME_CODE = 72;

export type PropositionRole = "first" | "coauthor" | "support";

export interface AuthoredProposition {
  id: number;
  type: string;
  /** AAAA-MM-DD */
  date: string;
  situationId: string;
  themes: readonly number[];
  role: PropositionRole;
}

export const SITUATION_CATEGORIES = [
  "norma",
  "aprovada-fora",
  "em-tramitacao",
  "apensada",
  "arquivada",
  "devolvida-retirada",
  "sem-situacao",
  "outra",
] as const;
export type SituationCategory = (typeof SITUATION_CATEGORIES)[number];

/**
 * Situação atual (código oficial `ultimoStatus.idSituacao`) → categoria da ficha.
 * Códigos conferidos nos arquivos de proposições de 2023 a 2026 (docs/FONTES.md).
 */
const SITUATION_BY_CODE: Record<string, SituationCategory> = {
  "1140": "norma", // Transformado em Norma Jurídica
  "926": "aprovada-fora", // Aguardando Apreciação pelo Senado Federal
  "1150": "aprovada-fora", // Aguardando Sanção
  "939": "aprovada-fora", // Aguardando Apreciação do Veto
  "900": "aprovada-fora", // Aguardando Autógrafos na Mesa
  "1293": "aprovada-fora", // Aguardando Envio ao Senado Federal
  "929": "aprovada-fora", // Aguardando Redação Final
  "1270": "aprovada-fora", // Aguardando Envio à Redação Final
  "925": "apensada", // Tramitando em Conjunto
  "927": "apensada", // Aguardando Apensação
  "923": "arquivada", // Arquivada
  "1120": "devolvida-retirada", // Devolvida ao(à) Autor(a)
  "950": "devolvida-retirada", // Retirado pelo(a) Autor(a)
  "907": "em-tramitacao", // Aguardando Designação de Relator(a)
  "915": "em-tramitacao", // Aguardando Parecer
  "924": "em-tramitacao", // Pronta para Pauta
  "1170": "em-tramitacao", // Aguardando Designação - Relator(a) que deixou de ser Membro
  "1201": "em-tramitacao", // Aguardando Despacho do Presidente (Chancela)
  "905": "em-tramitacao", // Aguardando Despacho do Presidente
  "904": "em-tramitacao", // Aguardando Deliberação de Recurso
  "903": "em-tramitacao", // Aguardando Deliberação
  "918": "em-tramitacao", // Aguardando Recurso
  "902": "em-tramitacao", // Aguardando Criação de Comissão Temporária
  "932": "em-tramitacao", // Aguardando Definição Encaminhamento
  "1220": "em-tramitacao", // Aguardando Despacho do Presidente (Análise)
  "901": "em-tramitacao", // Aguardando Constituição de Comissão Temporária
  "1200": "em-tramitacao", // Aguardando Autorização do Despacho
  "910": "em-tramitacao", // Aguardando Encaminhamento
  "1221": "em-tramitacao", // Aguardando Despacho do Presidente (Autorização)
  "1091": "em-tramitacao", // Ag. Análise de Inconstitucionalidade
  "922": "em-tramitacao", // Aguardando Vistas
  "1110": "em-tramitacao", // Aguardando Despacho do Presidente
  "1382": "em-tramitacao", // Aguardando Despacho do Presidente da Câmara dos Deputados
  "1210": "em-tramitacao", // Aguardando Chancela e Publicação do Despacho
  "1230": "outra", // Transformado em nova proposição
};

/** Códigos conhecidos (para avisar quando aparecer um novo). */
export function isKnownSituation(situationId: string): boolean {
  return situationId === "" || situationId in SITUATION_BY_CODE;
}

export function classifySituation(situationId: string): SituationCategory {
  if (situationId === "") return "sem-situacao";
  return SITUATION_BY_CODE[situationId] ?? "outra";
}

export interface PropositionsSummary {
  /** Por tipo principal: como autor principal e como coautor. Sempre os 5 tipos, na ordem. */
  byType: { type: MainPropositionType; first: number; coauthor: number }[];
  /** Autor principal, tipos principais, por ano de apresentação. */
  byYear: { year: number; first: number }[];
  /** Autor principal, tipos principais. */
  totalFirst: number;
  totalCoauthor: number;
  /** Assinaturas de apoio (não são autoria), tipos principais. */
  totalSupport: number;
  situations: { category: SituationCategory; count: number }[];
  becameLaw: number;
  /** becameLaw ÷ totalFirst; null sem projeto como autor principal. */
  conversionRate: number | null;
  /** Temas oficiais dos projetos como autor principal (um projeto pode ter vários). */
  themes: { code: number; count: number }[];
  withTheme: number;
  homage: number;
}

export function summarizePropositions(
  propositions: readonly AuthoredProposition[],
  years: readonly number[],
): PropositionsSummary {
  const main = propositions.filter((p) => isMainType(p.type));
  const first = main.filter((p) => p.role === "first");

  const byType = MAIN_PROPOSITION_TYPES.map((type) => ({
    type,
    first: main.filter((p) => p.type === type && p.role === "first").length,
    coauthor: main.filter((p) => p.type === type && p.role === "coauthor").length,
  }));
  const byYear = years.map((year) => ({
    year,
    first: first.filter((p) => Number(p.date.slice(0, 4)) === year).length,
  }));

  const situationCounts = new Map<SituationCategory, number>();
  for (const p of first) {
    const category = classifySituation(p.situationId);
    situationCounts.set(category, (situationCounts.get(category) ?? 0) + 1);
  }
  const situations = SITUATION_CATEGORIES.filter((c) => situationCounts.has(c)).map((category) => ({
    category,
    count: situationCounts.get(category) ?? 0,
  }));
  const becameLaw = situationCounts.get("norma") ?? 0;

  const themeCounts = new Map<number, number>();
  let withTheme = 0;
  let homage = 0;
  for (const p of first) {
    if (p.themes.length === 0) continue;
    withTheme++;
    if (p.themes.includes(HOMAGE_THEME_CODE)) homage++;
    for (const code of new Set(p.themes)) themeCounts.set(code, (themeCounts.get(code) ?? 0) + 1);
  }

  return {
    byType,
    byYear,
    totalFirst: first.length,
    totalCoauthor: main.filter((p) => p.role === "coauthor").length,
    totalSupport: main.filter((p) => p.role === "support").length,
    situations,
    becameLaw,
    conversionRate: safeRatio(becameLaw, first.length),
    themes: [...themeCounts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || a.code - b.code),
    withTheme,
    homage,
  };
}

export interface Opinion {
  /** AAAA-MM-DD */
  date: string;
  organ: string;
}

export interface OpinionsSummary {
  total: number;
  byYear: { year: number; count: number }[];
  byOrgan: { organ: string; count: number }[];
}

/** Pareceres de relator (PRL, PRLP, PRLE) de autoria do deputado. */
export function summarizeOpinions(
  opinions: readonly Opinion[],
  years: readonly number[],
): OpinionsSummary {
  const byOrgan = new Map<string, number>();
  for (const o of opinions) byOrgan.set(o.organ, (byOrgan.get(o.organ) ?? 0) + 1);
  return {
    total: opinions.length,
    byYear: years.map((year) => ({
      year,
      count: opinions.filter((o) => Number(o.date.slice(0, 4)) === year).length,
    })),
    byOrgan: [...byOrgan.entries()]
      .map(([organ, count]) => ({ organ, count }))
      .sort((a, b) => b.count - a.count || a.organ.localeCompare(b.organ)),
  };
}
