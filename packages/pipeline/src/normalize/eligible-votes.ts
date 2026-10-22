// Votações elegíveis para os jogos (ADR 0019): nominais de plenário, não secretas, de mérito e
// com proposição identificada. Na dúvida, a votação fica fora. Regras em docs/METODOLOGIA.md.

/** Tipos de proposição cuja votação de mérito entra nos jogos. */
export const MERIT_PROPOSITION_TYPES = ["PL", "PLP", "PEC", "PDL", "MPV", "PLV", "PRC"] as const;
export type MeritPropositionType = (typeof MERIT_PROPOSITION_TYPES)[number];

/** Nome por extenso (como aparece na descrição) → sigla. Do mais longo para o mais curto. */
const TYPE_NAMES: [RegExp, MeritPropositionType][] = [
  [/^Projeto de Lei Complementar$/i, "PLP"],
  [/^Projeto de Lei de Convers[aã]o$/i, "PLV"],
  [/^Projeto de Lei$/i, "PL"],
  [/^Projeto de Decreto Legislativo$/i, "PDL"],
  [/^Projeto de Resolu[cç][aã]o$/i, "PRC"],
  [/^Proposta de Emenda [àa] Constitui[cç][aã]o$/i, "PEC"],
  [/^Medida Provis[oó]ria$/i, "MPV"],
];

/**
 * Início de uma descrição de resultado de mérito: decisão sobre o texto principal (o projeto, a
 * PEC, a MPV) ou sobre o texto que o substitui por inteiro (substitutivo, subemenda substitutiva,
 * emenda substitutiva global, emenda aglutinativa substitutiva). Lista fechada; o resto fica fora:
 * requerimentos, recursos, destaques ("Mantido o texto"), emendas isoladas, preferência, parecer,
 * redação final e "Resultado".
 */
const MERIT_START = new RegExp(
  "^(Aprovad|Rejeitad)[oa]s?" +
    "(?:,? em (primeiro|segundo) turno,)? " +
    "(?:o|a) " +
    "(Projeto de (?:Lei Complementar|Lei de Convers[aã]o|Lei|Decreto Legislativo|Resolu[cç][aã]o)" +
    "|Proposta de Emenda [àa] Constitui[cç][aã]o" +
    "|Medida Provis[oó]ria" +
    "|Substitutivo(?: Reformulado)?" +
    "|Subemenda Substitutiva(?: Global)?" +
    "|Emenda Substitutiva Global" +
    "|Emenda Aglutinativa Substitutiva(?: Global)?)" +
    "(?=[\\s,.(]|$)",
  "i",
);

/** Primeira proposição citada na descrição: "Projeto de Lei nº 6.139, de 2023" ou "nº 6/2026". */
const REFERENCE = new RegExp(
  "(Projeto de Lei Complementar|Projeto de Lei de Convers[aã]o|Projeto de Lei|Projeto de Decreto Legislativo" +
    "|Projeto de Resolu[cç][aã]o|Proposta de Emenda [àa] Constitui[cç][aã]o|Medida Provis[oó]ria)" +
    "\\s+n\\s*[º°o.]*\\s*([\\d.]+)\\s*(?:,?\\s*de\\s+|/)\\s*(\\d{4})",
  "i",
);

export interface PropositionRef {
  type: MeritPropositionType;
  number: number;
  year: number;
}

export interface MeritDescription {
  approvedInText: boolean;
  turn: "primeiro" | "segundo" | null;
  /** O que foi votado, como na descrição ("Projeto de Lei", "Substitutivo"…). */
  object: string;
  /** Proposição citada na descrição, quando houver. */
  ref: PropositionRef | null;
}

export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function typeFromName(name: string): MeritPropositionType | null {
  const clean = collapseSpaces(name);
  for (const [pattern, type] of TYPE_NAMES) if (pattern.test(clean)) return type;
  return null;
}

/** Lê a descrição de resultado. Null = não é votação de mérito (fica fora). */
export function parseMeritDescription(description: string): MeritDescription | null {
  const text = collapseSpaces(description);
  const match = MERIT_START.exec(text);
  if (!match) return null;
  const ref = REFERENCE.exec(text);
  let parsedRef: PropositionRef | null = null;
  if (ref) {
    const type = typeFromName(ref[1]!);
    const number = Number(ref[2]!.replace(/\./g, ""));
    const year = Number(ref[3]);
    if (type && Number.isInteger(number) && number > 0) parsedRef = { type, number, year };
  }
  return {
    approvedInText: /^aprovad/i.test(match[1]!),
    turn: (match[2]?.toLowerCase() as "primeiro" | "segundo" | undefined) ?? null,
    object: collapseSpaces(match[3]!),
    ref: parsedRef,
  };
}

export interface PropositionInfo {
  id: number;
  type: string;
  number: number;
  year: number;
  summary: string;
}

/**
 * Sigla usada para comparar: o antigo "PDC" (projeto de decreto legislativo até 2019) é o "PDL".
 */
export function canonicalType(type: string): string {
  const upper = type.toUpperCase();
  return upper === "PDC" ? "PDL" : upper;
}

export const propositionKey = (type: string, number: number, year: number) =>
  `${canonicalType(type)} ${number}/${year}`;

const isMeritType = (type: string) =>
  (MERIT_PROPOSITION_TYPES as readonly string[]).includes(canonicalType(type));

export type ExclusionReason =
  | "secreta"
  | "procedimento"
  | "sem-proposicao"
  | "tipo-fora"
  | "sem-resultado"
  | "resultado-divergente";

export interface EligibilityInput {
  description: string;
  secret: boolean;
  /** Campo oficial `aprovacao` (1 = aprovada, 0 = rejeitada), quando existe. */
  approval: 0 | 1 | undefined;
  /** Proposições ligadas à votação no arquivo votacoesProposicoes. */
  linked: readonly PropositionInfo[];
  /** Proposições dos arquivos anuais, por chave "PL 50/2026" (quando a ligada não é a citada). */
  lookup: (key: string) => PropositionInfo | undefined;
}

export type EligibilityResult =
  | {
      eligible: true;
      merit: MeritDescription;
      proposition: PropositionInfo;
      approved: boolean;
    }
  | { eligible: false; reason: ExclusionReason };

export function classifyVote(input: EligibilityInput): EligibilityResult {
  if (input.secret) return { eligible: false, reason: "secreta" };
  const merit = parseMeritDescription(input.description);
  if (!merit) return { eligible: false, reason: "procedimento" };
  if (input.approval === undefined) return { eligible: false, reason: "sem-resultado" };
  // A descrição e o campo oficial têm de concordar; se não, alguém precisa olhar.
  if (merit.approvedInText !== (input.approval === 1)) {
    return { eligible: false, reason: "resultado-divergente" };
  }

  let proposition: PropositionInfo | undefined;
  if (merit.ref) {
    const key = propositionKey(merit.ref.type, merit.ref.number, merit.ref.year);
    proposition =
      input.linked.find((p) => propositionKey(p.type, p.number, p.year) === key) ??
      input.lookup(key);
  } else {
    // Sem proposição citada: só vale se houver exatamente uma ligada de tipo de mérito.
    const candidates = input.linked.filter((p) => isMeritType(p.type));
    if (candidates.length === 1) proposition = candidates[0];
  }
  if (!proposition || !proposition.summary.trim())
    return { eligible: false, reason: "sem-proposicao" };
  if (!isMeritType(proposition.type)) {
    return { eligible: false, reason: "tipo-fora" };
  }
  return { eligible: true, merit, proposition, approved: input.approval === 1 };
}

/** Rótulo curto da proposição: "PL 6.139/2023". */
export function propositionLabel(p: Pick<PropositionInfo, "type" | "number" | "year">): string {
  return `${p.type} ${p.number.toLocaleString("pt-BR")}/${p.year}`;
}
