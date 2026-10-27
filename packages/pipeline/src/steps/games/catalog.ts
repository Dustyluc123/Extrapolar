// Catálogo de votações elegíveis para os jogos (ADR 0019) e votos compactos dos deputados.
import {
  ELIGIBILITY_EXCLUSION_REASONS,
  GAMES_SCHEMA_VERSION,
  type Deputy,
  type GameDeputiesFile,
  type GameVote,
  type GameVotesFile,
  type VoteCounts,
} from "@extrapolar/shared";
import type { Ballot, BallotValue } from "@extrapolar/metrics";
import {
  classifyVote,
  propositionLabel,
  type ExclusionReason,
} from "../../normalize/eligible-votes";
import type { GameVotesSources } from "../fetch";
import type { PlainSummary } from "./summaries";

const BALLOT_CHAR: Record<BallotValue, string> = {
  yes: "S",
  no: "N",
  abstention: "A",
  obstruction: "O",
  article17: "P",
  secret: "-",
};

export interface Catalog {
  file: GameVotesFile;
  /** Votos por votação elegível: deputyId → voto. */
  ballotsByVote: Map<string, Map<number, BallotValue>>;
  /** Partido de cada deputado na data da votação (registrado no voto). */
  partyByVote: Map<string, Map<number, string | null>>;
}

export function buildCatalog(input: {
  sources: GameVotesSources;
  ballots: readonly Ballot[];
  summaries: ReadonlyMap<string, PlainSummary>;
  onUnusedSummary: (voteId: string) => void;
}): Catalog {
  const excluded = Object.fromEntries(ELIGIBILITY_EXCLUSION_REASONS.map((r) => [r, 0])) as Record<
    ExclusionReason,
    number
  >;
  const votes: GameVote[] = [];
  for (const info of input.sources.info.values()) {
    const result = classifyVote({
      description: info.description,
      secret: info.secret,
      approval: info.approval,
      linked: input.sources.linked.get(info.id) ?? [],
      lookup: (key) => input.sources.lookup.get(key),
    });
    if (!result.eligible) {
      excluded[result.reason]++;
      continue;
    }
    const summary = input.summaries.get(info.id);
    votes.push({
      id: info.id,
      date: info.date,
      proposition: {
        id: result.proposition.id,
        label: propositionLabel(result.proposition),
        summary: result.proposition.summary.replace(/\s+/g, " ").trim(),
      },
      plainSummary: summary?.reviewed ? { text: summary.text, curiosity: summary.curiosity } : null,
      object: result.merit.object,
      turn: result.merit.turn,
      approved: result.approved,
      official: info.official,
      counts: { yes: 0, no: 0, abstention: 0, obstruction: 0, article17: 0 },
    });
  }
  const ids = new Set(votes.map((v) => v.id));
  for (const voteId of input.summaries.keys()) if (!ids.has(voteId)) input.onUnusedSummary(voteId);

  const ballotsByVote = new Map<string, Map<number, BallotValue>>();
  const partyByVote = new Map<string, Map<number, string | null>>();
  for (const ballot of input.ballots) {
    if (!ids.has(ballot.voteId)) continue;
    let map = ballotsByVote.get(ballot.voteId);
    if (!map) {
      ballotsByVote.set(ballot.voteId, (map = new Map()));
      partyByVote.set(ballot.voteId, new Map());
    }
    map.set(ballot.deputyId, ballot.value);
    partyByVote.get(ballot.voteId)!.set(ballot.deputyId, ballot.party ?? null);
  }
  for (const vote of votes) {
    const counts: VoteCounts = { yes: 0, no: 0, abstention: 0, obstruction: 0, article17: 0 };
    for (const value of ballotsByVote.get(vote.id)?.values() ?? []) {
      if (value !== "secret") counts[value]++;
    }
    vote.counts = counts;
  }
  // Da mais antiga para a mais recente, pelo horário do registro (há várias no mesmo dia).
  const time = (id: string) => input.sources.info.get(id)?.dateTime ?? "";
  votes.sort((a, b) => time(a.id).localeCompare(time(b.id)) || a.id.localeCompare(b.id));
  return {
    file: {
      schemaVersion: GAMES_SCHEMA_VERSION,
      nominalVotes: input.sources.info.size,
      excluded,
      votes,
    },
    ballotsByVote,
    partyByVote,
  };
}

/** Deputados em exercício, em ordem de id (a ordem dos votos compactos). */
export function buildGameDeputies(deputies: readonly Deputy[]): GameDeputiesFile {
  return {
    schemaVersion: GAMES_SCHEMA_VERSION,
    deputies: [...deputies]
      .sort((a, b) => a.id - b.id)
      .map((d) => ({ id: d.id, name: d.name, party: d.party, state: d.state })),
  };
}

/** Votos de uma votação em formato compacto, na ordem de `jogos/deputados.json`. */
export function encodeBallots(
  order: readonly { id: number }[],
  ballots: ReadonlyMap<number, BallotValue> | undefined,
): string {
  return order.map((d) => BALLOT_CHAR[ballots?.get(d.id) ?? "secret"]).join("");
}
