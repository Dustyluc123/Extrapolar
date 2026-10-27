// Jogo 2 — Placar (ilha React). Na mesa, o ofício da votação e um boletim de palpite.
// Pergunta 1: como votou a maioria do estado do jogador. Pergunta 2: a porcentagem de Sim.
// A revelação confere o boletim campo a campo com o resultado oficial. Regras de pontuação em
// @extrapolar/games.
import { useEffect, useMemo, useRef, useState } from "react";
import type { DrawnDay, PlacarDay } from "@extrapolar/shared";
import {
  EMPTY_STATS,
  STATE_QUESTION_POINTS,
  currentStreak,
  decodeBallot,
  parseStats,
  placarScore,
  placarShareText,
  recordDay,
  requiredYesVotes,
  stateMajority,
  unscramble,
  yesShare,
  type BallotCode,
  type GameStats,
  type StateMajority,
} from "@extrapolar/games";
import { STATE_KEY, parseState, readStored, writeStored } from "../../lib/games/storage";
import {
  ExtraBanner,
  NotPublishedYet,
  PrivacyNote,
  ShareButton,
  StatePicker,
  formatDay,
  formatInt,
  formatPct,
  useToday,
} from "./common";
import { ScoreBar, voteDataUrl } from "./VoteCard";
import { playSound } from "../../lib/games/sound";
import { Badge } from "./desk/Badge";
import { Desk, DeskNote } from "./desk/Desk";
import { InkMark } from "./desk/InkMark";
import { Oficio } from "./desk/Oficio";

interface Props {
  days: DrawnDay[];
  /** UF de cada deputado em exercício, na ordem dos votos compactos. */
  deputyStates: string[];
  states: { code: string; name: string }[];
}

interface Answer {
  state: string;
  majority: Exclude<StateMajority, "none"> | null;
  guess: number;
}

const MAJORITY_LABEL: Record<StateMajority, string> = {
  yes: "Sim",
  no: "Não",
  tie: "Empate",
  none: "Nenhum voto Sim ou Não",
};

function parseAnswer(raw: unknown): Answer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.state !== "string" || typeof r.guess !== "number") return null;
  const majority =
    r.majority === "yes" || r.majority === "no" || r.majority === "tie" ? r.majority : null;
  return { state: r.state, majority, guess: Math.max(0, Math.min(100, r.guess)) };
}

export default function PlacarGame({ days, deputyStates, states }: Props) {
  const today = useToday();
  if (!today) return <p className="caption">Carregando…</p>;
  const day = days.find((d) => d.date === today);
  const lastDate = days.length > 0 ? days[days.length - 1]!.date : null;
  if (!day) return <NotPublishedYet lastDate={lastDate} />;
  let content: PlacarDay | null;
  try {
    content = JSON.parse(unscramble(day.data, today)) as PlacarDay;
  } catch {
    content = null;
  }
  if (!content) return <NotPublishedYet lastDate={lastDate} />;
  return (
    <PlacarRound
      key={today}
      today={today}
      number={day.number}
      content={content}
      deputyStates={deputyStates}
      states={states}
    />
  );
}

function PlacarRound({
  today,
  number,
  content,
  deputyStates,
  states,
}: {
  today: string;
  number: number;
  content: PlacarDay;
  deputyStates: string[];
  states: { code: string; name: string }[];
}) {
  const { vote, ballots } = content;
  const storageKey = `placar:${today}`;
  const codes = useMemo(() => states.map((s) => s.code), [states]);
  const [state, setState] = useState<string | null>(null);
  const [majority, setMajority] = useState<Answer["majority"]>(null);
  const [guess, setGuess] = useState(50);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [loaded, setLoaded] = useState(false);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    setState(readStored(STATE_KEY, (raw) => parseState(raw, codes), null));
    setAnswer(readStored(storageKey, parseAnswer, null));
    setStats(readStored("placar:estatisticas", parseStats, EMPTY_STATS));
    setLoaded(true);
  }, [codes, storageKey]);

  const stateBallots = (code: string): (BallotCode | null)[] =>
    deputyStates.flatMap((s, i) => (s === code ? [decodeBallot(ballots[i])] : []));

  const actual = yesShare(vote.official.yes, vote.official.no) ?? 0;
  if (!loaded) return null;

  const submit = () => {
    if (!state) return;
    const result: Answer = { state, majority, guess };
    playSound("paper");
    setFresh(true);
    setAnswer(result);
    writeStored(storageKey, result);
    const real = stateMajority(stateBallots(state));
    const points =
      placarScore(guess, actual) +
      (real !== "none" && majority === real ? STATE_QUESTION_POINTS : 0);
    const updated = recordDay(stats, today, true, String(Math.floor(points / 25) * 25));
    setStats(updated);
    writeStored("placar:estatisticas", updated);
  };

  const stateName = (code: string | null) =>
    states.find((s) => s.code === code)?.name ?? code ?? "";

  const badge = (
    <Badge
      items={[
        ["jogos", stats.played],
        ["sequência", currentStreak(stats, today)],
        ["maior sequência", stats.maxStreak],
        ["completos", stats.completed],
      ]}
    />
  );

  return (
    <div>
      <Desk label={`Mesa de votação · Placar #${number}`} aside={badge}>
        <DeskNote className="font-sans text-sm font-bold">
          Placar #{number} · {formatDay(today)} · uma votação por dia
        </DeskNote>
        <Oficio vote={vote} tab={`Placar #${number}`} className="sheet-tilt-l mt-5" />

        {answer ? (
          <Reveal
            today={today}
            number={number}
            content={content}
            answer={answer}
            actual={actual}
            stateBallots={stateBallots(answer.state)}
            stateName={stateName(answer.state)}
            fresh={fresh}
          />
        ) : (
          <form
            className="sheet boletim sheet-tilt-r -mt-2 space-y-6 sm:mx-4"
            aria-labelledby="placar-boletim"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <span className="paper-clip" aria-hidden="true" />
            <header className="oficio-head">
              <p id="placar-boletim" className="oficio-brand">
                Boletim de palpite
              </p>
              <p className="oficio-sub">Preencha e entregue · nº {number}</p>
            </header>
            <fieldset className="m-0 border-0 p-0">
              <legend className="font-display text-xl font-[700]">
                1. Como votou a maioria dos deputados{" "}
                {state ? `de ${stateName(state)}` : "do seu estado"}?
              </legend>
              <div className="mt-2">
                <StatePicker
                  id="placar-estado"
                  states={states}
                  value={state}
                  onChange={(code) => {
                    setState(code);
                    writeStored(STATE_KEY, code);
                  }}
                />
              </div>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Maioria do estado"
              >
                {(["yes", "no", "tie"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="ballot-option"
                    aria-pressed={majority === option}
                    onClick={() => setMajority(option)}
                  >
                    <span className="ballot-box" aria-hidden="true">
                      {majority === option ? "✕" : ""}
                    </span>
                    {MAJORITY_LABEL[option]}
                  </button>
                ))}
              </div>
              <p className="caption m-0 mt-1">
                Contam só os votos Sim e Não dos deputados em exercício hoje.
              </p>
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="font-display text-xl font-[700]">
                2. Dos votos Sim e Não do plenário, quantos foram Sim?
              </legend>
              <label
                htmlFor="placar-palpite"
                className="mt-2 block font-display text-4xl font-[800]"
              >
                {guess}% Sim
              </label>
              <div className="ruler">
                <input
                  id="placar-palpite"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={guess}
                  onChange={(event) => setGuess(Number(event.target.value))}
                  className="slider"
                  aria-valuetext={`${guess}% de votos Sim`}
                />
                <div className="ruler-ticks" aria-hidden="true" />
              </div>
              <div className="flex justify-between font-sans text-xs text-ink-soft">
                <span>0% (todos Não)</span>
                <span>100% (todos Sim)</span>
              </div>
            </fieldset>

            <div>
              <button type="submit" className="game-button" disabled={!state || majority === null}>
                Entregar o boletim
              </button>
              {!state || majority === null ? (
                <p className="caption m-0 mt-1">
                  Escolha o estado e responda a pergunta 1 para continuar.
                </p>
              ) : null}
            </div>
          </form>
        )}
      </Desk>
      <PrivacyNote />
    </div>
  );
}

function Reveal({
  today,
  number,
  content,
  answer,
  actual,
  stateBallots,
  stateName,
  fresh,
}: {
  today: string;
  number: number;
  content: PlacarDay;
  answer: Answer;
  actual: number;
  stateBallots: (BallotCode | null)[];
  stateName: string;
  fresh: boolean;
}) {
  const { vote } = content;
  const real = stateMajority(stateBallots);
  const stateYes = stateBallots.filter((b) => b === "yes").length;
  const stateNo = stateBallots.filter((b) => b === "no").length;
  const stateOther = stateBallots.filter((b) => b && b !== "yes" && b !== "no").length;
  const stateNone = stateBallots.filter((b) => b === null).length;
  const stateApplies = real !== "none";
  const stateCorrect = stateApplies && answer.majority === real;
  const scorePoints = placarScore(answer.guess, actual);
  const total = scorePoints + (stateCorrect ? STATE_QUESTION_POINTS : 0);
  const max = 100 + (stateApplies ? STATE_QUESTION_POINTS : 0);
  const required = requiredYesVotes(vote.proposition.label);
  const quorumSurprise = !vote.approved && vote.official.yes > vote.official.no;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!fresh) return;
    headingRef.current?.focus();
    const timer = setTimeout(() => playSound("seal"), 700);
    return () => clearTimeout(timer);
  }, [fresh]);

  return (
    <section
      className={`sheet boletim sheet-tilt-r -mt-2 sm:mx-4${fresh ? " sheet-slide" : ""}`}
      aria-live="polite"
      aria-labelledby="placar-revelacao"
    >
      <span className="paper-clip" aria-hidden="true" />
      <ExtraBanner>Edição extra · boletim conferido</ExtraBanner>
      <div className="mt-4 text-center">
        <span
          className="stamp-big stamp-in"
          style={fresh ? { animationDelay: "600ms" } : undefined}
        >
          {vote.approved ? "Aprovada" : "Rejeitada"}
        </span>
      </div>
      <h2
        id="placar-revelacao"
        ref={headingRef}
        tabIndex={-1}
        className="m-0 mt-4 font-display text-2xl font-[750]"
      >
        {vote.proposition.label}: {vote.approved ? "aprovada" : "rejeitada"} por{" "}
        {formatInt(vote.official.yes)} a {formatInt(vote.official.no)}
      </h2>
      <div className="mt-3">
        <ScoreBar yes={vote.official.yes} no={vote.official.no} />
        <p className="caption m-0 mt-1">
          Sim {formatInt(vote.official.yes)} · Não {formatInt(vote.official.no)} · outros votos{" "}
          {formatInt(vote.official.others)} (abstenção {formatInt(vote.counts.abstention)},
          obstrução {formatInt(vote.counts.obstruction)}, Art. 17 {formatInt(vote.counts.article17)}
          ). Placar oficial.
        </p>
      </div>
      {required !== null ? (
        <p className="translate-note mt-3">
          {quorumSurprise ? "Por que perdeu com mais Sim? " : ""}
          {vote.proposition.label.startsWith("PEC")
            ? `Uma PEC precisa de ${required} votos Sim (três quintos dos 513 deputados) em cada turno.`
            : `Um projeto de lei complementar precisa de ${required} votos Sim (maioria absoluta dos 513 deputados).`}
        </p>
      ) : null}

      <table className="check-table mt-5">
        <caption className="oficio-label text-left">Seu boletim × resultado oficial</caption>
        <thead>
          <tr>
            <th scope="col">Campo</th>
            <th scope="col">Seu palpite</th>
            <th scope="col">Oficial</th>
            <th scope="col">Pontos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Maioria de {stateName}</th>
            <td>{answer.majority ? MAJORITY_LABEL[answer.majority] : "—"}</td>
            <td>
              {stateApplies ? (
                <>
                  <strong>{MAJORITY_LABEL[real]}</strong>
                  <span className="check-detail">
                    {formatInt(stateYes)} Sim, {formatInt(stateNo)} Não
                    {stateOther > 0 ? `, ${formatInt(stateOther)} outros` : ""}
                    {stateNone > 0 ? `, ${formatInt(stateNone)} sem voto registrado` : ""}
                  </span>
                </>
              ) : (
                <span className="check-detail">
                  Nenhum deputado de {stateName} em exercício hoje votou Sim ou Não; não vale
                  pontos.
                </span>
              )}
            </td>
            <td>{stateCorrect ? `+${STATE_QUESTION_POINTS}` : "0"}</td>
          </tr>
          <tr>
            <th scope="row">Porcentagem de Sim</th>
            <td>{answer.guess}%</td>
            <td>
              <strong>{formatPct(actual, 1)}</strong>
            </td>
            <td>+{scorePoints}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-display text-3xl font-[800]">
          {total} de {max} pontos
        </p>
        <InkMark word="Conferido" seed={`placar-${today}`} fresh={fresh} />
      </div>
      <p className="caption m-0">
        Confira na fonte: <a href={voteDataUrl(vote.id)}>dado bruto da votação na Câmara</a>.
      </p>
      <ShareButton
        text={placarShareText({
          number,
          stateCorrect,
          scorePoints,
          url: `${window.location.origin}/jogos/placar`,
        })}
      />
      <p className="caption m-0 mt-3">
        Amanhã tem outra votação. Votado em {formatDay(vote.date, true)}.
      </p>
    </section>
  );
}
