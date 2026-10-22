// Comissões: cargos dos deputados nos órgãos da Câmara, reuniões que entram na presença e
// eventos originados por requerimentos. Regras em docs/METODOLOGIA.md (#comissoes,
// #presenca-comissoes, #eventos-requeridos).
import {
  idFromUri,
  type CamaraEvent,
  type CamaraEventOrgan,
  type CamaraOrgan,
  type CamaraOrganMember,
  type CamaraPropositionAuthor,
  type OrganMembership,
} from "@extrapolar/shared";
import type { CommitteeMeeting, MembershipInterval } from "@extrapolar/metrics";
import type { QualityLog } from "./quality";
import { isFinishedEvent } from "./sessions";

/** Tipos de órgão que contam como "comissão" na presença e em "titular hoje". */
export const COMMITTEE_TYPES = new Set([
  "Comissão Permanente",
  "Comissão Especial",
  "Comissão Parlamentar de Inquérito",
]);

/** Cargos com direito a voto na comissão (titular e quem preside ou vice-preside). */
export const VOTING_MEMBER_ROLE = /^(Titular|Presidente|Vice-Presidente|\dº Vice-Presidente)$/;

/** Tipos de reunião que entram na presença em comissões (todas com presença registrada). */
export const COMMITTEE_MEETING_TYPES = new Set([
  "Reunião Deliberativa",
  "Audiência Pública",
  "Audiência Pública e Deliberação",
  "Reunião de Comparecimento de Ministro(a)",
  "Reunião",
  "Reunião de Instalação e Eleição",
  "Reunião de Eleição",
  "Tomada de Depoimento",
]);

export interface DeputyOrgans {
  memberships: OrganMembership[];
  /** Só comissões (COMMITTEE_TYPES) e só cargos com direito a voto. */
  votingIntervals: MembershipInterval[];
}

export function buildOrganMemberships(input: {
  members: readonly CamaraOrganMember[];
  organs: readonly CamaraOrgan[];
  deputyIds: ReadonlySet<number>;
  referenceDate: string;
  quality: QualityLog;
}): Map<number, DeputyOrgans> {
  const organById = new Map(input.organs.map((o) => [idFromUri(o.uri), o]));
  const result = new Map<number, DeputyOrgans>();
  for (const member of input.members) {
    const deputyId = idFromUri(member.uriDeputado);
    if (!input.deputyIds.has(deputyId)) continue;
    if (member.dataInicio > input.referenceDate) continue;
    const end = member.dataFim === "" ? null : member.dataFim;
    if (end !== null && end < member.dataInicio) {
      input.quality.add(
        "cargo-com-datas-invertidas",
        "Cargo em órgão com data de fim anterior à de início (ignorado).",
      );
      continue;
    }
    const organId = idFromUri(member.uriOrgao);
    const organ = organById.get(organId);
    const tipo = organ?.tipoOrgao ?? "Não informado";
    let entry = result.get(deputyId);
    if (!entry) result.set(deputyId, (entry = { memberships: [], votingIntervals: [] }));
    entry.memberships.push({
      organId,
      sigla: member.siglaOrgao,
      nome: member.nomePublicacaoOrgao || member.nomeOrgao,
      tipo,
      cargo: member.cargo,
      inicio: member.dataInicio,
      fim: end !== null && end > input.referenceDate ? null : end,
    });
    if (COMMITTEE_TYPES.has(tipo) && VOTING_MEMBER_ROLE.test(member.cargo)) {
      entry.votingIntervals.push({ organId, start: member.dataInicio, end });
    }
  }
  for (const entry of result.values()) {
    entry.memberships.sort(
      (a, b) => a.inicio.localeCompare(b.inicio) || a.sigla.localeCompare(b.sigla),
    );
  }
  return result;
}

export function selectCommitteeMeetings(input: {
  events: readonly CamaraEvent[];
  eventOrgans: readonly CamaraEventOrgan[];
  committeeOrganIds: ReadonlySet<number>;
  start: string;
  end: string;
  referenceDateTime: string;
}): CommitteeMeeting[] {
  const limit = input.end < input.referenceDateTime ? input.end : input.referenceDateTime;
  const organsByEvent = new Map<number, number[]>();
  for (const o of input.eventOrgans) {
    if (!input.committeeOrganIds.has(o.idOrgao)) continue;
    let list = organsByEvent.get(o.idEvento);
    if (!list) organsByEvent.set(o.idEvento, (list = []));
    list.push(o.idOrgao);
  }
  const meetings: CommitteeMeeting[] = [];
  for (const event of input.events) {
    const organIds = organsByEvent.get(event.id);
    if (!organIds) continue;
    if (!COMMITTEE_MEETING_TYPES.has(event.descricaoTipo) || !isFinishedEvent(event)) continue;
    if (event.dataHoraInicio < input.start || event.dataHoraInicio > limit) continue;
    meetings.push({ id: event.id, dateTime: event.dataHoraInicio, organIds });
  }
  return meetings;
}

/** Autoria compacta: por proposição, os deputados que assinaram. */
export interface Authorship {
  deputyId: number;
  /** Posição na lista de assinaturas (1 = primeiro signatário). */
  order: number;
  /** true = proponente (autor); false = assinatura de apoio. */
  proponent: boolean;
}

export function isFirstSigner(a: Authorship): boolean {
  return a.proponent && a.order === 1;
}

export function addAuthors(
  target: Map<number, Authorship[]>,
  authors: readonly CamaraPropositionAuthor[],
): void {
  for (const author of authors) {
    if (author.idDeputadoAutor === undefined) continue;
    let list = target.get(author.idProposicao);
    if (!list) target.set(author.idProposicao, (list = []));
    list.push({
      deputyId: author.idDeputadoAutor,
      order: Number(author.ordemAssinatura),
      proponent: author.proponente === "1",
    });
  }
}
