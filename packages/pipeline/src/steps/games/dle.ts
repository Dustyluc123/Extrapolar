// Jogo 1 — Dle do seu estado: atributos factuais dos deputados de cada estado e sorteio diário.
import {
  GAMES_SCHEMA_VERSION,
  dleStateFileSchema,
  foldText,
  type Deputy,
  type DeputyDetail,
  type DleDeputy,
  type DleStateFile,
} from "@extrapolar/shared";
import { COMMITTEE_TYPES, VOTING_MEMBER_ROLE } from "../../normalize/committees";
import type { DeputyRecord } from "../fetch";
import type { Federation } from "../../sources/camara-api";
import type { OutputFile } from "../publish";
import type { DrawState } from "./draw";
import { makeRank } from "./draw";

/**
 * Ano de início de uma legislatura. Desde a 39ª (1951) elas duram 4 anos; antes disso, null
 * (nenhum deputado em exercício estreou antes de 1951, mas a regra não inventa ano).
 */
export function legislatureStartYear(legislatureId: number): number | null {
  if (legislatureId < 39) return null;
  return 1951 + 4 * (legislatureId - 39);
}

/** Siglas das comissões em que o deputado é titular (com voto) na data de referência. */
export function currentCommittees(detail: DeputyDetail, today: string): string[] {
  const siglas = new Set<string>();
  for (const p of detail.comissoes.participacoes) {
    if (!COMMITTEE_TYPES.has(p.tipo) || !VOTING_MEMBER_ROLE.test(p.cargo)) continue;
    if (p.inicio > today || (p.fim !== null && p.fim < today)) continue;
    siglas.add(p.sigla);
  }
  return [...siglas].sort();
}

export function dleDeputy(
  deputy: Deputy,
  detail: DeputyDetail,
  record: DeputyRecord | undefined,
  today: string,
): DleDeputy {
  const birthYear = record?.birthDate ? Number(record.birthDate.slice(0, 4)) : null;
  return {
    id: deputy.id,
    name: deputy.name,
    party: deputy.party,
    condition: deputy.electoralCondition,
    since: record ? legislatureStartYear(record.firstLegislature) : null,
    birthYear,
    birthState: record?.birthState ?? null,
    committees: currentCommittees(detail, today),
    projects: detail.projetos.autorPrincipal,
  };
}

export function buildDle(input: {
  deputies: readonly Deputy[];
  details: ReadonlyMap<number, DeputyDetail>;
  records: ReadonlyMap<number, DeputyRecord>;
  federations: readonly Federation[];
  today: string;
  draw: DrawState;
  secret: string;
  onMissingRecord: (id: number) => void;
}): OutputFile[] {
  const federations: Record<string, string> = {};
  for (const f of input.federations) for (const party of f.parties) federations[party] = f.name;
  // A sigla do partido no deputado pode vir em caixa diferente da federação: compara sem acento.
  const federationOf = (party: string) =>
    Object.entries(federations).find(([p]) => foldText(p) === foldText(party))?.[1];

  const byState = new Map<string, Deputy[]>();
  for (const deputy of input.deputies) {
    const list = byState.get(deputy.state) ?? [];
    list.push(deputy);
    byState.set(deputy.state, list);
  }
  const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
  const files: OutputFile[] = [];
  for (const [state, list] of [...byState.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const deputies = list
      .map((deputy) => {
        const record = input.records.get(deputy.id);
        if (!record) input.onMissingRecord(deputy.id);
        return dleDeputy(deputy, input.details.get(deputy.id)!, record, input.today);
      })
      .sort((a, b) => collator.compare(a.name, b.name));
    const stateFederations: Record<string, string> = {};
    for (const d of deputies) {
      const fed = federationOf(d.party);
      if (fed) stateFederations[d.party] = fed;
    }
    const days = input.draw.draw({
      key: `dle-${state}`,
      ids: deputies.map((d) => String(d.id)),
      today: input.today,
      rank: makeRank(input.secret, `dle-${state}`),
      payload: (id) => id,
    });
    const file: DleStateFile = {
      schemaVersion: GAMES_SCHEMA_VERSION,
      state,
      federations: stateFederations,
      deputies,
      days,
    };
    files.push({ name: `jogos/dle/${state}.json`, schema: dleStateFileSchema, data: file });
  }
  return files;
}
