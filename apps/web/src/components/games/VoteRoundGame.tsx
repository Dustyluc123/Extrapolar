// Jogo 3 — Vote você também (ilha React). Uma pilha com as 10 votações da semana na mesa: o
// jogador carimba SIM ou NÃO, ou separa para depois; no fim, um relatório com os deputados com
// quem votou igual mais vezes. Só uma conta de votos iguais, nunca recomendação.
import { useEffect, useMemo, useRef, useState } from "react";
import type { VoteRoundFile } from "@extrapolar/shared";
import {
  agreement,
  decodeBallot,
  voteRoundShareText,
  type AgreementResult,
  type BallotCode,
  type PlayerChoice,
} from "@extrapolar/games";
import { STATE_KEY, parseState, readStored, writeStored } from "../../lib/games/storage";
import { PrivacyNote, ShareButton, StatePicker, formatDay, formatInt } from "./common";
import { Badge } from "./desk/Badge";
import { Desk, DeskNote } from "./desk/Desk";
import { EmptyStampArea, Oficio } from "./desk/Oficio";
import { StampPad } from "./desk/StampPad";

interface Props {
  round: VoteRoundFile;
  deputies: { id: number; name: string; party: string; state: string }[];
  states: { code: string; name: string }[];
}

type Choices = Record<string, PlayerChoice | null>;

interface RoundState {
  choices: Choices;
  done: boolean;
  /** Ids separados para depois (ainda sem carimbo). Campo novo; ausente no formato antigo. */
  later: string[];
}

const EMPTY: RoundState = { choices: {}, done: false, later: [] };

const ORIENTATION_BALLOT: Record<string, BallotCode | null> = {
  S: "yes",
  N: "no",
  A: "abstention",
  O: "obstruction",
};

function parseRound(raw: unknown, ids: readonly string[]): RoundState {
  const r = (raw ?? {}) as Partial<RoundState>;
  const choices: Choices = {};
  for (const id of ids) {
    const value = r.choices?.[id];
    if (value === "yes" || value === "no" || value === null) choices[id] = value;
  }
  const later = Array.isArray(r.later)
    ? ids.filter((id) => r.later!.includes(id) && !(id in choices))
    : [];
  return {
    choices,
    done: r.done === true && Object.keys(choices).length === ids.length,
    later,
  };
}

export default function VoteRoundGame({ round, deputies, states }: Props) {
  const ids = useMemo(() => round.votes.map((v) => v.id), [round.votes]);
  const codes = useMemo(() => states.map((s) => s.code), [states]);
  const storageKey = `vote-voce:${round.week}`;
  const [state, setState] = useState<string | null>(null);
  const [progress, setProgress] = useState<RoundState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [moved, setMoved] = useState(false);
  const finishRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setState(readStored(STATE_KEY, (raw) => parseState(raw, codes), null));
    setProgress(readStored(storageKey, (raw) => parseRound(raw, ids), EMPTY));
    setLoaded(true);
  }, [codes, ids, storageKey]);

  // Quando a pilha acaba, os carimbos somem: o foco vai para o botão do relatório.
  useEffect(() => {
    if (moved) finishRef.current?.focus();
  }, [moved, progress]);

  if (round.votes.length === 0) {
    return (
      <p className="clipping">Ainda não há votações suficientes para a rodada desta semana.</p>
    );
  }
  if (!loaded) return <p className="caption">Carregando…</p>;

  const save = (next: RoundState, message = "") => {
    setProgress(next);
    writeStored(storageKey, next);
    setAnnouncement(message);
    setMoved(true);
  };
  const answered = ids.filter((id) => id in progress.choices).length;
  const stamped = Object.values(progress.choices).filter((c) => c !== null).length;
  const blank = answered - stamped;
  // Primeiro a pilha principal; depois, os separados para depois, na ordem da rodada.
  const fromPile = round.votes.find(
    (v) => !(v.id in progress.choices) && !progress.later.includes(v.id),
  );
  const fromTray = fromPile ? undefined : round.votes.find((v) => progress.later.includes(v.id));
  const current = fromPile ?? fromTray;
  const remainingInPile = round.votes.filter(
    (v) => !(v.id in progress.choices) && !progress.later.includes(v.id),
  ).length;
  const position = current ? ids.indexOf(current.id) + 1 : ids.length;

  if (progress.done) {
    return (
      <Results
        round={round}
        deputies={deputies}
        states={states}
        state={state}
        choices={progress.choices}
        onState={(code) => {
          setState(code);
          writeStored(STATE_KEY, code);
        }}
        onRestart={() => save(EMPTY)}
      />
    );
  }

  const stamp = (choice: PlayerChoice | null) => {
    if (!current) return;
    const next: RoundState = {
      ...progress,
      choices: { ...progress.choices, [current.id]: choice },
      later: progress.later.filter((id) => id !== current.id),
    };
    const word = choice === "yes" ? "Sim" : choice === "no" ? "Não" : "em branco";
    save(
      next,
      `${current.proposition.label}: ${choice ? `carimbado ${word}` : "deixado em branco"}.`,
    );
  };
  const separate = () => {
    if (!current || !fromPile) return;
    save(
      { ...progress, later: [...progress.later, current.id] },
      `${current.proposition.label} foi para a bandeja Para depois.`,
    );
  };

  const tray = round.votes.filter((v) => progress.later.includes(v.id));

  return (
    <div>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      <Desk
        label={`Mesa de votação · semana de ${formatDay(round.week, true)}`}
        aside={
          <>
            {current ? (
              <StampPad prompt="E você, votaria como?" onStamp={(choice) => stamp(choice)}>
                <div className="mt-3 flex flex-wrap gap-2">
                  {fromPile ? (
                    <button type="button" className="desk-action" onClick={separate}>
                      Separar para depois
                    </button>
                  ) : (
                    <button type="button" className="desk-action" onClick={() => stamp(null)}>
                      Deixar em branco
                    </button>
                  )}
                </div>
              </StampPad>
            ) : null}
            <Badge
              role="Rodada da semana"
              items={[
                ["carimbados", stamped],
                ["em branco", blank],
                ["para depois", tray.length],
                ["na pilha", remainingInPile],
              ]}
            />
            {tray.length > 0 ? (
              <div className="tray" role="group" aria-label="Bandeja Para depois">
                <p className="tray-label">Bandeja · Para depois</p>
                <ul className="m-0 list-none p-0">
                  {tray.map((v) => (
                    <li key={v.id} className="tray-item">
                      {v.proposition.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        }
      >
        <DeskNote className="font-sans text-sm font-bold">
          {current
            ? fromPile
              ? `Documento ${position} de ${ids.length} · ${remainingInPile} na pilha`
              : `Da bandeja Para depois · ${tray.length} separado${tray.length > 1 ? "s" : ""}`
            : `Pilha terminada · ${stamped} carimbados, ${blank} em branco`}
        </DeskNote>
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-on-desk)_25%,transparent)]"
          aria-hidden="true"
        >
          <div
            className="h-full bg-on-desk"
            style={{ width: `${(answered / ids.length) * 100}%` }}
          />
        </div>
        {current ? (
          <div
            className="pile mt-6"
            data-depth={Math.min(3, Math.max(0, remainingInPile + tray.length - 1))}
          >
            <Oficio
              key={current.id}
              vote={current}
              tab={fromPile ? `Documento ${position} de ${ids.length}` : "Separado para depois"}
              headingId="vv-oficio"
              className={moved ? "sheet-in" : ""}
              stampArea={<EmptyStampArea />}
            />
          </div>
        ) : (
          <div className="sheet mt-6">
            <p className="oficio-label m-0">Pilha terminada</p>
            <p className="m-0 mt-2 font-display text-2xl font-[720]">
              Você passou pelas {ids.length} votações.
            </p>
            <p className="m-0 mt-2">
              {stamped} com carimbo{blank > 0 ? `, ${blank} em branco (não entram na conta)` : ""}.
            </p>
            <button
              ref={finishRef}
              type="button"
              className="game-button mt-4"
              onClick={() => save({ ...progress, done: true })}
            >
              Ver o relatório final
            </button>
          </div>
        )}
        {current && fromTray && tray.length > 1 ? (
          <p className="mt-4">
            <button
              type="button"
              className="desk-link"
              onClick={() => {
                const choices = { ...progress.choices };
                for (const v of tray) choices[v.id] = null;
                save({ ...progress, choices, later: [] }, "Separados deixados em branco.");
              }}
            >
              Deixar os {tray.length} separados em branco
            </button>
          </p>
        ) : null}
        {answered > 0 && current ? (
          <p className="mt-3">
            <button
              type="button"
              className="desk-link font-sans text-sm"
              onClick={() => {
                const choices = { ...progress.choices };
                const last = ids.filter((id) => id in choices).at(-1);
                if (last) delete choices[last];
                save({ ...progress, choices, done: false }, "Último carimbo desfeito.");
              }}
            >
              Desfazer o último carimbo
            </button>
          </p>
        ) : null}
      </Desk>
      <PrivacyNote />
    </div>
  );
}

interface Row {
  id: number;
  name: string;
  party: string;
  state: string;
  result: AgreementResult;
}

function sortRows(rows: Row[]): Row[] {
  const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
  // Base pequena vai para o fim: 2 de 2 não fica acima de 7 de 9.
  return rows.sort(
    (a, b) =>
      Number(a.result.smallBase) - Number(b.result.smallBase) ||
      (b.result.rate ?? -1) - (a.result.rate ?? -1) ||
      b.result.compared - a.result.compared ||
      collator.compare(a.name, b.name),
  );
}

function Results({
  round,
  deputies,
  states,
  state,
  choices,
  onState,
  onRestart,
}: {
  round: VoteRoundFile;
  deputies: Props["deputies"];
  states: Props["states"];
  state: string | null;
  choices: Choices;
  onState: (code: string) => void;
  onRestart: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const voted = Object.values(choices).filter((c) => c !== null).length;
  const skipped = round.votes.length - voted;

  const rows = useMemo(() => {
    return deputies.map((d, index): Row => {
      const ballots: Record<string, BallotCode | null> = {};
      round.votes.forEach((v, i) => (ballots[v.id] = decodeBallot(round.ballots[i]![index])));
      return { ...d, result: agreement(choices, ballots) };
    });
  }, [deputies, round, choices]);

  const withData = rows.filter((r) => r.result.compared > 0);
  const own = sortRows(withData.filter((r) => r.state === state));
  const all = sortRows([...withData]);
  const shown = showAll ? all : all.slice(0, 20);

  const parties = round.parties
    .map((p) => {
      const orientations: Record<string, BallotCode | null> = {};
      round.votes.forEach(
        (v, i) => (orientations[v.id] = ORIENTATION_BALLOT[p.orientations[i]!] ?? null),
      );
      return { party: p.party, result: agreement(choices, orientations) };
    })
    .filter((p) => p.result.compared > 0)
    .sort(
      (a, b) =>
        Number(a.result.smallBase) - Number(b.result.smallBase) ||
        (b.result.rate ?? 0) - (a.result.rate ?? 0) ||
        b.result.compared - a.result.compared ||
        a.party.localeCompare(b.party),
    );

  const stateName = states.find((s) => s.code === state)?.name;

  return (
    <Desk label={`Mesa de votação · semana de ${formatDay(round.week, true)}`}>
      <div className="sheet sheet-slide">
        <span className="paper-clip" aria-hidden="true" />
        <header className="oficio-head">
          <p className="oficio-brand">Extrapolar</p>
          <p className="oficio-sub">
            Relatório final · rodada da semana de {formatDay(round.week, true)}
          </p>
        </header>
        <h2 className="m-0 mt-4 font-display text-2xl font-[750]">Com quem você votou igual</h2>
        <p className="m-0 mt-2">
          Você carimbou {voted} de {round.votes.length} votações
          {skipped > 0 ? ` e deixou ${skipped} em branco` : ""}.
        </p>
        <p className="translate-note mt-3">
          É só uma conta: votos iguais ÷ votações em que vocês dois votaram Sim ou Não. Não é
          recomendação nem nota — {voted} votações dizem pouco sobre um mandato inteiro.
        </p>
        {voted === 0 ? (
          <p className="mt-4">Você deixou todas as votações em branco; não há o que comparar.</p>
        ) : (
          <>
            <section className="mt-6" aria-labelledby="vv-estado">
              <h3 id="vv-estado" className="font-display text-xl font-[700]">
                Deputados {stateName ? `de ${stateName}` : "do seu estado"}
              </h3>
              <StatePicker id="vv-estado-sel" states={states} value={state} onChange={onState} />
              {state ? (
                <AgreementList rows={own} total={round.votes.length} />
              ) : (
                <p className="caption">Escolha o estado.</p>
              )}
            </section>

            <section className="mt-8" aria-labelledby="vv-partidos">
              <h3 id="vv-partidos" className="font-display text-xl font-[700]">
                Orientação dos partidos
              </h3>
              <p className="caption m-0">
                Orientação do próprio partido ou, se não houver, da federação; orientação de bloco
                não entra (<a href="/metodologia#alinhamento-partido">regra do alinhamento</a>).
              </p>
              {parties.length === 0 ? (
                <p>Nenhum partido orientou Sim ou Não nas votações em que você votou.</p>
              ) : (
                <ul className="m-0 mt-2 list-none p-0">
                  {parties.map((p) => (
                    <li
                      key={p.party}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule py-2"
                    >
                      <span className="font-sans font-semibold">{p.party}</span>
                      <span>
                        concordou em {p.result.agreed} de {p.result.compared}
                        {p.result.smallBase ? (
                          <span className="caption"> · base pequena</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8" aria-labelledby="vv-todos">
              <h3 id="vv-todos" className="font-display text-xl font-[700]">
                Todos os deputados
              </h3>
              <AgreementList rows={shown} total={round.votes.length} showState />
              {all.length > 20 ? (
                <button
                  type="button"
                  className="game-button game-button-ghost game-button-small mt-3"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Mostrar só os 20 primeiros"
                    : `Mostrar todos (${formatInt(all.length)})`}
                </button>
              ) : null}
            </section>
          </>
        )}
        <ShareButton
          text={voteRoundShareText({
            week: formatDay(round.week, true),
            voted,
            skipped,
            url: `${window.location.origin}/jogos/vote-voce-tambem`,
          })}
        />
        <p className="caption mt-3">
          <button type="button" className="underline" onClick={onRestart}>
            Votar de novo nesta rodada
          </button>{" "}
          · Rodada nova toda segunda-feira.
        </p>
      </div>
    </Desk>
  );
}

function AgreementList({
  rows,
  total,
  showState = false,
}: {
  rows: Row[];
  total: number;
  showState?: boolean;
}) {
  if (rows.length === 0) return <p className="caption">Nenhum deputado com votos para comparar.</p>;
  return (
    <ol className="m-0 mt-2 list-none p-0">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-rule py-2"
        >
          <span>
            <a href={`/deputados/${r.id}`} className="font-semibold">
              {r.name}
            </a>{" "}
            <span className="caption">
              {r.party}
              {showState ? ` · ${r.state}` : ""}
            </span>
          </span>
          <span className="font-sans text-sm">
            concordou em <strong>{r.result.agreed}</strong> de {r.result.compared} votações
            {r.result.smallBase ? (
              <span className="caption"> · base pequena (menos de 5 de {total})</span>
            ) : null}
            {r.result.otherBallots > 0 ? (
              <span className="caption">
                {" "}
                · {r.result.otherBallots} com outro voto (abstenção, obstrução ou Art. 17)
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
