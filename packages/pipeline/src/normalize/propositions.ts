// Proposições: reduz os arquivos anuais (grandes) ao que os cadernos 3 e 4 usam, só para
// proposições com deputado autor. Regras em docs/METODOLOGIA.md (#proposicoes e seguintes).
import { idFromUri, type CamaraProposition, type CamaraPropositionTheme } from "@extrapolar/shared";
import { isMainType } from "@extrapolar/metrics";
import type { Authorship } from "./committees";

/** Requerimentos de convocação, pelo tipo oficial (codTipo) — docs/METODOLOGIA.md#convocacoes. */
export const CONVOCATION_REQUEST_CODES = new Map<number, string>([
  [523, "Convocação de Ministro de Estado na Comissão"],
  [356, "Convocação de Ministro de Estado no Plenário"],
  [150, "Convocação de Autoridade"],
]);

/** Pareceres de relator: PRL (comissão), PRLP (plenário), PRLE (às emendas). */
export const OPINION_TYPES = new Set(["PRL", "PRLP", "PRLE"]);
/** Fiscalização e sugestões ao Executivo (Caderno 4). */
export const OVERSIGHT_TYPES = new Set(["RIC", "PFC", "INC"]);

export function isKeptProposition(p: Pick<CamaraProposition, "siglaTipo" | "codTipo">): boolean {
  return (
    isMainType(p.siglaTipo) ||
    OPINION_TYPES.has(p.siglaTipo) ||
    OVERSIGHT_TYPES.has(p.siglaTipo) ||
    (p.siglaTipo === "REQ" && CONVOCATION_REQUEST_CODES.has(p.codTipo))
  );
}

export interface CompactProposition {
  id: number;
  type: string;
  codType: number;
  /** AAAA-MM-DD */
  date: string;
  situationId: string;
  organId: number;
  /** Apensada a esta proposição (tramitando em conjunto), ou null. */
  principalId: number | null;
}

export interface TypeCount {
  /** Sigla do tipo (REQ, PL...). */
  sigla: string;
  /** Nome oficial do subtipo (descricaoTipo), ex.: "Requerimento de Audiência Pública". */
  name: string;
  first: number;
  coauthor: number;
}

export interface PropositionsReduction {
  propositions: Map<number, CompactProposition>;
  /** Por deputado: todas as proposições de que é autor (qualquer tipo), por subtipo oficial. */
  typeCounts: Map<number, Map<string, TypeCount>>;
}

export function reducePropositions(input: {
  target: PropositionsReduction;
  items: readonly CamaraProposition[];
  authorship: ReadonlyMap<number, readonly Authorship[]>;
  deputyIds: ReadonlySet<number>;
  /** AAAA-MM-DDTHH:mm:ss */
  start: string;
  limit: string;
}): void {
  const { target, authorship, deputyIds } = input;
  for (const p of input.items) {
    if (p.dataApresentacao < input.start || p.dataApresentacao > input.limit) continue;
    const authors = authorship.get(p.id)?.filter((a) => deputyIds.has(a.deputyId));
    if (!authors || authors.length === 0) continue;

    for (const author of authors) {
      if (!author.proponent) continue;
      let counts = target.typeCounts.get(author.deputyId);
      if (!counts) target.typeCounts.set(author.deputyId, (counts = new Map()));
      const key = `${p.siglaTipo}:${p.codTipo}`;
      const count = counts.get(key) ?? {
        sigla: p.siglaTipo,
        name: p.descricaoTipo,
        first: 0,
        coauthor: 0,
      };
      if (author.order === 1) count.first++;
      else count.coauthor++;
      counts.set(key, count);
    }

    if (!isKeptProposition(p)) continue;
    target.propositions.set(p.id, {
      id: p.id,
      type: p.siglaTipo,
      codType: p.codTipo,
      date: p.dataApresentacao.slice(0, 10),
      situationId: p.ultimoStatus.idSituacao,
      organId: idFromUri(p.uriOrgaoNumerador),
      principalId: p.uriPropPrincipal ? idFromUri(p.uriPropPrincipal) : null,
    });
  }
}

/** Temas oficiais das proposições principais guardadas. */
export function addThemes(
  target: Map<number, number[]>,
  themes: readonly CamaraPropositionTheme[],
  propositions: ReadonlyMap<number, CompactProposition>,
): void {
  for (const theme of themes) {
    const id = idFromUri(theme.uriProposicao);
    const p = propositions.get(id);
    if (!p || !isMainType(p.type)) continue;
    const list = target.get(id) ?? [];
    if (!list.includes(theme.codTema)) list.push(theme.codTema);
    target.set(id, list);
  }
}
