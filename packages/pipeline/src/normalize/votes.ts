// Seleciona as votações nominais de plenário da legislatura e converte os votos individuais.
// Regras em docs/METODOLOGIA.md e ADR 0007.
import type { CamaraBallot, CamaraVote } from "@extrapolar/shared";
import type { Ballot, BallotValue, NominalVote } from "@extrapolar/metrics";
import type { QualityLog } from "./quality";

export const PLENARY_ORGAN = "PLEN";

const BALLOT_VALUES: Record<CamaraBallot["voto"], BallotValue> = {
  Sim: "yes",
  Não: "no",
  Abstenção: "abstention",
  Obstrução: "obstruction",
  "Artigo 17": "article17",
  "": "secret",
};

/** Votação secreta, segundo a descrição da última abertura de votação. */
export function isSecretVote(vote: CamaraVote): boolean {
  return /secreta/i.test(vote.ultimaAberturaVotacao?.descricao ?? "");
}

export interface PlenaryVotesSelection {
  votes: NominalVote[];
  ballots: Ballot[];
}

/**
 * Votação nominal de plenário = siglaOrgao "PLEN" com ao menos um voto individual registrado,
 * dentro da legislatura (de `start` a `end`, horário local) e até a data de referência.
 */
export function selectNominalPlenaryVotes(input: {
  votes: readonly CamaraVote[];
  ballots: readonly CamaraBallot[];
  start: string;
  end: string;
  referenceDateTime: string;
  quality: QualityLog;
}): PlenaryVotesSelection {
  const { start, end, referenceDateTime, quality } = input;
  const limit = end < referenceDateTime ? end : referenceDateTime;

  const ballotsByVote = new Map<string, CamaraBallot[]>();
  for (const ballot of input.ballots) {
    let list = ballotsByVote.get(ballot.idVotacao);
    if (!list) ballotsByVote.set(ballot.idVotacao, (list = []));
    list.push(ballot);
  }

  const votes: NominalVote[] = [];
  const ballots: Ballot[] = [];
  const seenVotes = new Set<string>();

  for (const vote of input.votes) {
    if (vote.siglaOrgao !== PLENARY_ORGAN) continue;
    const voteBallots = ballotsByVote.get(vote.id);
    if (!voteBallots || voteBallots.length === 0) continue; // simbólica

    if (seenVotes.has(vote.id)) {
      quality.add("votacao-duplicada", "Votação repetida nos arquivos; mantida uma.");
      continue;
    }

    let dateTime = vote.dataHoraRegistro;
    if (dateTime === "") {
      // Sem horário de registro: usa o primeiro voto registrado.
      dateTime = voteBallots.map((b) => b.dataHoraVoto).sort()[0] as string;
      quality.add(
        "votacao-sem-horario",
        "Votação nominal de plenário sem dataHoraRegistro; usado o horário do primeiro voto.",
      );
    }
    if (dateTime < start || dateTime > limit) continue;

    seenVotes.add(vote.id);
    votes.push({ id: vote.id, dateTime });

    const secret = isSecretVote(vote);
    const seenDeputies = new Set<number>();
    for (const ballot of voteBallots) {
      const deputyId = Number(ballot.deputado_.id);
      if (seenDeputies.has(deputyId)) {
        quality.add(
          "voto-duplicado",
          "Deputado com dois votos na mesma votação; mantido o primeiro.",
        );
        continue;
      }
      seenDeputies.add(deputyId);
      if (ballot.voto === "" && !secret) {
        throw new Error(
          `Voto vazio na votação ${vote.id}, que não está marcada como secreta. ` +
            "O formato dos votos pode ter mudado; confira antes de publicar (ADR 0008).",
        );
      }
      ballots.push({ voteId: vote.id, deputyId, value: BALLOT_VALUES[ballot.voto] });
    }
  }

  votes.sort((a, b) => a.dateTime.localeCompare(b.dateTime) || a.id.localeCompare(b.id));
  return { votes, ballots };
}
