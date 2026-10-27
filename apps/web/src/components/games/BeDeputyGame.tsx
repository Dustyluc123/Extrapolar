// Jogo 4 — Seja deputado (ilha React): a votação elegível mais recente. O jogador vota e depois
// vê o resultado, o placar e quem votou o quê, com filtros por estado e partido.
import { useEffect, useMemo, useState } from "react";
import type { LatestVoteFile } from "@extrapolar/shared";
import {
  beDeputyShareText,
  decodeBallot,
  requiredYesVotes,
  type BallotCode,
  type PlayerChoice,
} from "@extrapolar/games";
import { STATE_KEY, parseState, readStored, writeStored } from "../../lib/games/storage";
import { ExtraBanner, PrivacyNote, ShareButton, formatDay, formatInt } from "./common";
import { ScoreBar, VoteCard, voteDataUrl } from "./VoteCard";
import { SummaryText } from "./SummaryText";

interface Props {
  latest: LatestVoteFile;
  deputies: { id: number; name: string; party: string; state: string }[];
  states: { code: string; name: string }[];
  /** Data da edição (última atualização dos dados). */
  editionDate: string;
}

const GROUPS: { key: BallotCode | "none"; label: string }[] = [
  { key: "yes", label: "Sim" },
  { key: "no", label: "Não" },
  { key: "abstention", label: "Abstenção" },
  { key: "obstruction", label: "Obstrução" },
  { key: "article17", label: "Art. 17 (presidia a sessão)" },
  { key: "none", label: "Sem voto registrado" },
];

const ORIENTATION_TEXT: Record<string, string> = {
  S: "Sim",
  N: "Não",
  A: "Abstenção",
  O: "Obstrução",
  L: "Liberou a bancada",
  B: "Só o bloco orientou",
  "-": "Sem orientação",
};

export default function BeDeputyGame({ latest, deputies, states, editionDate }: Props) {
  const { vote } = latest;
  const storageKey = `seja-deputado:${vote.id}`;
  const codes = useMemo(() => states.map((s) => s.code), [states]);
  const [choice, setChoice] = useState<PlayerChoice | null>(null);
  const [state, setState] = useState<string>("");
  const [party, setParty] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setChoice(
      readStored<PlayerChoice | null>(
        storageKey,
        (raw) => (raw === "yes" || raw === "no" ? raw : null),
        null,
      ),
    );
    setState(readStored(STATE_KEY, (raw) => parseState(raw, codes), null) ?? "");
    setLoaded(true);
  }, [codes, storageKey]);

  const rows = useMemo(
    () =>
      deputies.map((d, i) => ({
        ...d,
        ballot: decodeBallot(latest.ballots[i]),
        partyAtVote: latest.partiesAtVote[i] ?? "",
      })),
    [deputies, latest],
  );
  const parties = useMemo(() => [...new Set(deputies.map((d) => d.party))].sort(), [deputies]);

  const datePanel = (
    <p className="m-0 mt-2 inline-block rounded border-2 border-ink px-2 py-1 font-sans text-sm font-bold">
      Votação de {formatDay(vote.date, true)} · a mais recente até a edição de{" "}
      {formatDay(editionDate.slice(0, 10), true)}
    </p>
  );

  if (!loaded) return <p className="caption">Carregando…</p>;

  if (!choice) {
    return (
      <div>
        {datePanel}
        <div className="mt-3">
          <VoteCard vote={vote} />
        </div>
        <p className="mt-5 mb-2 font-display text-2xl font-[750]">
          Hoje a cadeira é sua. Como você vota?
        </p>
        <div className="flex flex-wrap gap-2">
          {(["yes", "no"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className="choice"
              onClick={() => {
                setChoice(option);
                writeStored(storageKey, option);
              }}
            >
              {option === "yes" ? "Sim" : "Não"}
            </button>
          ))}
        </div>
        <PrivacyNote />
      </div>
    );
  }

  const filtered = rows.filter(
    (r) => (!state || r.state === state) && (!party || r.party === party),
  );
  const required = requiredYesVotes(vote.proposition.label);
  const plenaryMajority =
    vote.official.yes === vote.official.no
      ? null
      : vote.official.yes > vote.official.no
        ? "yes"
        : "no";

  return (
    <div>
      {datePanel}
      <section className="clipping mt-4" aria-labelledby="sd-resultado">
        <ExtraBanner>Edição extra</ExtraBanner>
        <div className="mt-4 text-center">
          <span className="stamp-big stamp-in">{vote.approved ? "Aprovada" : "Rejeitada"}</span>
        </div>
        <h2 id="sd-resultado" className="m-0 mt-4 font-display text-2xl font-[750]">
          {vote.proposition.label}: {vote.approved ? "aprovada" : "rejeitada"} por{" "}
          {formatInt(vote.official.yes)} a {formatInt(vote.official.no)}
        </h2>
        <p className="m-0 mt-2">
          {vote.plainSummary ? (
            <SummaryText text={vote.plainSummary.text} />
          ) : (
            vote.proposition.summary
          )}
        </p>
        <div className="mt-3">
          <ScoreBar yes={vote.official.yes} no={vote.official.no} />
          <p className="caption m-0 mt-1">
            Placar oficial: Sim {formatInt(vote.official.yes)} · Não {formatInt(vote.official.no)} ·
            outros {formatInt(vote.official.others)}. <a href={voteDataUrl(vote.id)}>Dado bruto</a>
          </p>
        </div>
        {required !== null ? (
          <p className="translate-note mt-3">
            {!vote.approved && vote.official.yes > vote.official.no
              ? "Por que perdeu com mais Sim? "
              : ""}
            {vote.proposition.label.startsWith("PEC")
              ? `Uma PEC precisa de ${required} votos Sim (três quintos dos 513 deputados) em cada turno.`
              : `Um projeto de lei complementar precisa de ${required} votos Sim (maioria absoluta dos 513 deputados).`}
          </p>
        ) : null}
        <p className="m-0 mt-3">
          Você votou <strong>{choice === "yes" ? "Sim" : "Não"}</strong>
          {plenaryMajority
            ? choice === plenaryMajority
              ? ", como a maioria do plenário."
              : ", como a minoria do plenário."
            : "; o plenário empatou entre Sim e Não."}
        </p>
        <ShareButton
          text={beDeputyShareText({
            date: formatDay(vote.date, true),
            url: `${window.location.origin}/jogos/seja-deputado`,
          })}
        />
      </section>

      <section className="mt-8" aria-labelledby="votos">
        <h2 id="votos" className="font-display text-2xl font-[750]">
          Quem votou o quê
        </h2>
        <p className="caption m-0">
          Deputados em exercício hoje, com o voto registrado nesta votação. Partido atual; entre
          parênteses, o da época, quando era outro.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <span className="kicker">Estado</span>
            <select
              className="min-h-11 rounded border border-ink bg-paper px-2 font-sans text-ink"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                if (e.target.value) writeStored(STATE_KEY, e.target.value);
              }}
            >
              <option value="">Todos</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="kicker">Partido</span>
            <select
              className="min-h-11 rounded border border-ink bg-paper px-2 font-sans text-ink"
              value={party}
              onChange={(e) => setParty(e.target.value)}
            >
              <option value="">Todos</option>
              {parties.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="caption mt-2" aria-live="polite">
          {formatInt(filtered.length)} deputados com esses filtros.
        </p>
        <div className="mt-2 grid gap-5 sm:grid-cols-2">
          {GROUPS.map((group) => {
            const list = filtered.filter((r) =>
              group.key === "none" ? r.ballot === null : r.ballot === group.key,
            );
            if (list.length === 0) return null;
            return (
              <div key={group.key}>
                <h3 className="m-0 border-b border-ink font-sans text-sm font-bold tracking-wide uppercase">
                  {group.label} · {formatInt(list.length)}
                </h3>
                <ul className="m-0 mt-1 list-none p-0 text-[0.98rem]">
                  {list.map((r) => (
                    <li key={r.id} className="py-0.5">
                      <a href={`/deputados/${r.id}`}>{r.name}</a>{" "}
                      <span className="caption">
                        {r.party}
                        {r.partyAtVote && r.partyAtVote !== r.party
                          ? ` (${r.partyAtVote})`
                          : ""} · {r.state}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="sd-orientacoes">
        <h2 id="sd-orientacoes" className="font-display text-xl font-[700]">
          Orientação dos partidos
        </h2>
        <p className="caption m-0">
          Do próprio partido ou, se não houver, da federação; a de bloco não é atribuída aos
          partidos (<a href="/metodologia#alinhamento-partido">ADR 0014</a>).
        </p>
        <ul className="m-0 mt-2 grid list-none gap-x-6 p-0 sm:grid-cols-2">
          {latest.parties.map((p) => (
            <li key={p.party} className="flex justify-between gap-2 border-t border-rule py-1.5">
              <span className="font-sans font-semibold">{p.party}</span>
              <span>
                {ORIENTATION_TEXT[p.orientations[0] ?? "-"]}
                {p.viaFederation[0] === "1" ? <span className="caption"> (federação)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p className="caption mt-6">
        <button
          type="button"
          className="underline"
          onClick={() => {
            setChoice(null);
            writeStored(storageKey, null);
          }}
        >
          Votar de novo
        </button>
      </p>
    </div>
  );
}
