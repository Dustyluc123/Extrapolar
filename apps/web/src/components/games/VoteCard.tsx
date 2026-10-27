// Cartão de uma votação (jogos 2, 3 e 4): o que foi votado, com a fonte oficial.
import type { GameVote } from "@extrapolar/shared";
import { formatDay } from "./common";
import { SummaryText } from "./SummaryText";

export function propositionUrl(id: number): string {
  return `https://www.camara.leg.br/propostas-legislativas/${id}`;
}
export function voteDataUrl(voteId: string): string {
  return `https://dadosabertos.camara.leg.br/api/v2/votacoes/${voteId}`;
}

export function VoteCard({
  vote,
  headingLevel = 2,
  compact = false,
}: {
  vote: GameVote;
  headingLevel?: 2 | 3;
  compact?: boolean;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={compact ? "" : "clipping"}>
      <p className="kicker m-0">
        Plenário · {formatDay(vote.date, true)}
        {vote.turn ? ` · ${vote.turn} turno` : ""}
      </p>
      <Heading className="m-0 mt-1 font-display text-xl font-[720] sm:text-2xl">
        {vote.proposition.label}
      </Heading>
      <p className="m-0 mt-2 text-[1.05rem]">
        {vote.plainSummary ? (
          <SummaryText text={vote.plainSummary.text} />
        ) : (
          vote.proposition.summary
        )}
      </p>
      {vote.plainSummary?.curiosity ? (
        <p className="m-0 mt-2">
          <strong>Curiosidade:</strong> <SummaryText text={vote.plainSummary.curiosity} />
        </p>
      ) : null}
      <p className="caption m-0 mt-2">
        {vote.plainSummary ? "Resumo em linguagem simples, revisado. " : "Ementa oficial. "}O que
        foi votado: {vote.object.toLowerCase()}.{" "}
        <a href={propositionUrl(vote.proposition.id)}>Ver a proposição na Câmara</a>
      </p>
      {vote.plainSummary ? (
        <p className="caption m-0 mt-1">Ementa oficial: {vote.proposition.summary}</p>
      ) : null}
    </article>
  );
}

/** Barra do placar: Sim (tinta) e Não (hachurado), com os números escritos. */
export function ScoreBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPct = total > 0 ? (yes / total) * 100 : 0;
  return (
    <div>
      <div className="score-bar" role="img" aria-label={`Sim: ${yes} votos; Não: ${no} votos`}>
        <span className="score-yes" style={{ width: `${yesPct}%` }}>
          {yesPct >= 18 ? `Sim ${yes}` : ""}
        </span>
        <span className="score-no">{100 - yesPct >= 18 ? `Não ${no}` : ""}</span>
      </div>
    </div>
  );
}
