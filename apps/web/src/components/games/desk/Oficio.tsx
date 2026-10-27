// O documento da votação na mesa: papel timbrado do Extrapolar com a proposição, a sessão e o
// texto (resumo revisado ou ementa oficial). Tudo vem dos dados gerados; nada é inventado — o
// número do documento é o da própria proposição. Não imita papel oficial da Câmara: o timbre é
// do Extrapolar e diz que é um documento de jogo.
import type { ReactNode } from "react";
import type { GameVote } from "@extrapolar/shared";
import { formatDay } from "../common";
import { SummaryText } from "../SummaryText";
import { propositionUrl } from "../VoteCard";

export function Oficio({
  vote,
  tab,
  headingLevel = 2,
  headingId,
  stampArea,
  children,
  className = "",
}: {
  vote: GameVote;
  /** Etiqueta de pasta no alto do papel ("Votação mais recente", "Documento 3 de 10"). */
  tab?: string;
  headingLevel?: 2 | 3;
  headingId?: string;
  /** Conteúdo do campo "Para deliberação": a marca do carimbo ou o espaço vazio. */
  stampArea?: ReactNode;
  /** Outros campos no pé do documento (ex.: o boletim do Placar). */
  children?: ReactNode;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={`sheet oficio ${className}`} aria-labelledby={headingId}>
      <span className="paper-clip" aria-hidden="true" />
      {tab ? <p className="sheet-tab">{tab}</p> : null}
      <header className="oficio-head">
        <p className="oficio-brand">Extrapolar</p>
        <p className="oficio-sub">Mesa de votação · documento de jogo com dados oficiais</p>
      </header>
      <dl className="oficio-fields">
        <div>
          <dt>Sessão</dt>
          <dd>
            Plenário da Câmara · {formatDay(vote.date, true)}
            {vote.turn ? ` · ${vote.turn} turno` : ""}
          </dd>
        </div>
        <div>
          <dt>Em votação</dt>
          <dd>{vote.object}</dd>
        </div>
      </dl>
      <Heading id={headingId} className="oficio-title">
        {vote.proposition.label}
      </Heading>
      <p className="oficio-label">
        {vote.plainSummary ? "Assunto, em linguagem simples" : "Assunto (ementa oficial)"}
      </p>
      <p className="m-0 mt-1 text-[1.05rem]">
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
      {vote.plainSummary ? (
        <p className="caption m-0 mt-2">
          Resumo revisado. Ementa oficial: {vote.proposition.summary}
        </p>
      ) : null}
      <p className="caption m-0 mt-2">
        <a href={propositionUrl(vote.proposition.id)}>Ver a proposição na Câmara</a>
      </p>
      {stampArea !== undefined ? (
        <div className="oficio-deliberation">
          <p className="oficio-label">Para deliberação do(a) parlamentar</p>
          <div className="oficio-stamp-area">{stampArea}</div>
        </div>
      ) : null}
      {children}
    </article>
  );
}

/** Espaço vazio do carimbo, antes do voto. */
export function EmptyStampArea() {
  return <span className="oficio-stamp-empty">Espaço reservado ao carimbo</span>;
}
