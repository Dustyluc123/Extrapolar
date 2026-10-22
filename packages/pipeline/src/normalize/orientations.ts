// Orientações de bancada nas votações nominais de plenário e resolução da orientação que vale
// para um deputado: a do próprio partido; se não houver, a da federação do partido; orientação de
// bloco não é usada (a composição dos blocos nas datas passadas não é publicada — ADR 0014).
import { foldText, type CamaraOrientation } from "@extrapolar/shared";
import type { ResolvedOrientation } from "@extrapolar/metrics";
import type { Federation } from "../sources/camara-api";

export const GOVERNMENT_BANCADA = "Governo";
/** Bancadas que não são partido, federação nem bloco (lideranças). */
const LEADERSHIP_BANCADAS = new Set(["governo", "maioria", "minoria", "oposicao"]);

/**
 * Nomes de partido que a Câmara usa na sigla da bancada e que não começam com a sigla oficial.
 * (Ex.: a bancada do PODE aparece como "Podemos".) Conferido nos arquivos de 2023 a 2026.
 */
const PARTY_ALIASES: Record<string, string[]> = { pode: ["podemos"] };

const VALUE: Record<CamaraOrientation["orientacao"], ResolvedOrientation> = {
  Sim: { kind: "value", value: "yes" },
  Não: { kind: "value", value: "no" },
  Abstenção: { kind: "value", value: "abstention" },
  Obstrução: { kind: "value", value: "obstruction" },
  Liberado: { kind: "free" },
  "": { kind: "none" },
};

export type BancadaKind = "lideranca" | "federacao" | "bloco" | "partido";

export function bancadaKind(siglaBancada: string): BancadaKind {
  const folded = foldText(siglaBancada);
  if (LEADERSHIP_BANCADAS.has(folded)) return "lideranca";
  if (folded.startsWith("fdr ")) return "federacao";
  if (folded.startsWith("bl ") || folded.startsWith("bloco")) return "bloco";
  return "partido";
}

/**
 * A bancada é do partido? Compara sem acento; aceita nome truncado pela Câmara
 * ("Solidaried" = SOLIDARIEDADE, "Republican" = REPUBLICANOS) e os apelidos de PARTY_ALIASES.
 */
export function bancadaMatchesParty(siglaBancada: string, party: string): boolean {
  const bancada = foldText(siglaBancada);
  const names = [foldText(party), ...(PARTY_ALIASES[foldText(party)] ?? [])];
  return names.some(
    (name) => name === bancada || (bancada.length >= 6 && name.startsWith(bancada)),
  );
}

/** A bancada "Fdr PT-PCdoB-PV" corresponde à federação? Todos os partidos têm de bater. */
export function bancadaMatchesFederation(siglaBancada: string, federation: Federation): boolean {
  const tokens = siglaBancada
    .replace(/^Fdr\s+/i, "")
    .split("-")
    .map(foldText)
    .filter(Boolean);
  if (tokens.length !== federation.parties.length) return false;
  return tokens.every((token) =>
    federation.parties.some((p) => {
      const party = foldText(p);
      return party === token || (token.length >= 4 && party.startsWith(token));
    }),
  );
}

/** Orientações de uma votação: lista de { bancada, orientação }. */
export type VoteOrientations = readonly CamaraOrientation[];

export function indexOrientations(
  orientations: readonly CamaraOrientation[],
  voteIds: ReadonlySet<string>,
): Map<string, CamaraOrientation[]> {
  const byVote = new Map<string, CamaraOrientation[]>();
  for (const orientation of orientations) {
    if (!voteIds.has(orientation.idVotacao)) continue;
    let list = byVote.get(orientation.idVotacao);
    if (!list) byVote.set(orientation.idVotacao, (list = []));
    list.push(orientation);
  }
  return byVote;
}

export interface PartyOrientation {
  orientation: ResolvedOrientation;
  fromFederation: boolean;
}

export function resolvePartyOrientation(
  orientations: VoteOrientations | undefined,
  party: string | null,
  federations: readonly Federation[],
): PartyOrientation {
  if (!orientations || !party) return { orientation: { kind: "none" }, fromFederation: false };

  const own = orientations.find(
    (o) => bancadaKind(o.siglaBancada) === "partido" && bancadaMatchesParty(o.siglaBancada, party),
  );
  if (own) return { orientation: VALUE[own.orientacao], fromFederation: false };

  const federation = federations.find((f) =>
    f.parties.some((p) => foldText(p) === foldText(party)),
  );
  if (federation) {
    const fed = orientations.find(
      (o) =>
        bancadaKind(o.siglaBancada) === "federacao" &&
        bancadaMatchesFederation(o.siglaBancada, federation),
    );
    if (fed) return { orientation: VALUE[fed.orientacao], fromFederation: true };
  }

  const hasBloc = orientations.some((o) => bancadaKind(o.siglaBancada) === "bloco");
  return { orientation: hasBloc ? { kind: "bloc-only" } : { kind: "none" }, fromFederation: false };
}

export function resolveGovernmentOrientation(
  orientations: VoteOrientations | undefined,
): ResolvedOrientation {
  const gov = orientations?.find((o) => foldText(o.siglaBancada) === foldText(GOVERNMENT_BANCADA));
  return gov ? VALUE[gov.orientacao] : { kind: "none" };
}
