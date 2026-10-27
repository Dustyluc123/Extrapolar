// Jogo 1 — Dle do seu estado (ilha React). Na mesa, uma investigação de arquivo: a pasta secreta
// do deputado do dia e, ao lado, uma ficha para cada chute, com as pistas marcadas como abas de
// fichário. No fim, a pasta abre com a foto. Regras em @extrapolar/games; dados em
// /jogos/dados/dle-{UF}.json. O estado do jogo fica só no navegador.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { DleDeputy, DleStateFile } from "@extrapolar/shared";
import {
  EMPTY_STATS,
  compareAll,
  currentStreak,
  dleShareText,
  maxGuessesFor,
  parseStats,
  recordDay,
  searchNames,
  unscramble,
  type AttributeFeedback,
  type GameStats,
} from "@extrapolar/games";
import { dleAttributes, dleValues, displayValue } from "../../lib/games/dle-rules";
import { STATE_KEY, parseState, readStored, writeStored } from "../../lib/games/storage";
import {
  ExtraBanner,
  NotPublishedYet,
  PrivacyNote,
  ShareButton,
  StatePicker,
  formatDay,
  useToday,
} from "./common";
import { playSound } from "../../lib/games/sound";
import { Badge } from "./desk/Badge";
import { Desk, DeskNote } from "./desk/Desk";

interface Props {
  states: { code: string; name: string; count: number }[];
}

interface DayState {
  guesses: number[];
  hint: boolean;
}

const STATUS_TEXT: Record<AttributeFeedback["status"], string> = {
  hit: "igual",
  near: "perto",
  miss: "diferente",
  unknown: "sem dado para comparar",
};
const SYMBOL: Record<AttributeFeedback["status"], string> = {
  hit: "✓",
  near: "≈",
  miss: "✗",
  unknown: "?",
};

function parseDayState(raw: unknown): DayState {
  const r = (raw ?? {}) as Partial<DayState>;
  return {
    guesses: Array.isArray(r.guesses)
      ? r.guesses.filter((n): n is number => typeof n === "number")
      : [],
    hint: r.hint === true,
  };
}

export default function DleGame({ states }: Props) {
  const today = useToday();
  const [state, setState] = useState<string | null>(null);
  const [data, setData] = useState<DleStateFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codes = useMemo(() => states.map((s) => s.code), [states]);

  useEffect(() => {
    setState(readStored(STATE_KEY, (raw) => parseState(raw, codes), null));
  }, [codes]);

  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/jogos/dados/dle-${state}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<DleStateFile>;
      })
      .then((file) => !cancelled && setData(file))
      .catch(
        () =>
          !cancelled && setError("Não deu para carregar os deputados deste estado. Tente de novo."),
      );
    return () => {
      cancelled = true;
    };
  }, [state]);

  const chooseState = (code: string) => {
    setState(code);
    writeStored(STATE_KEY, code);
  };

  const stateName = states.find((s) => s.code === state)?.name;

  return (
    <div>
      <StatePicker
        id="dle-estado"
        states={states}
        value={state}
        onChange={chooseState}
        label="Estado"
      />
      <PrivacyNote />
      {!state ? (
        <p className="mt-4">
          Escolha um estado para começar. Cada estado tem o seu deputado do dia.
        </p>
      ) : error ? (
        <p className="mt-4" role="alert">
          {error}
        </p>
      ) : !data || !today ? (
        <p className="mt-4 caption" aria-live="polite">
          Carregando a bancada…
        </p>
      ) : (
        <DleBoard
          key={`${data.state}-${today}`}
          data={data}
          today={today}
          stateName={stateName ?? data.state}
        />
      )}
    </div>
  );
}

function DleBoard({
  data,
  today,
  stateName,
}: {
  data: DleStateFile;
  today: string;
  stateName: string;
}) {
  const day = data.days.find((d) => d.date === today) ?? null;
  const lastDate = data.days.length > 0 ? data.days[data.days.length - 1]!.date : null;
  if (!day) return <NotPublishedYet lastDate={lastDate} />;
  let answerId: number | null = null;
  try {
    answerId = Number(JSON.parse(unscramble(day.data, today)));
  } catch {
    answerId = null;
  }
  const answer = data.deputies.find((d) => d.id === answerId);
  if (!answer) return <NotPublishedYet lastDate={lastDate} />;
  return (
    <DleRound data={data} today={today} number={day.number} answer={answer} stateName={stateName} />
  );
}

function DleRound({
  data,
  today,
  number,
  answer,
  stateName,
}: {
  data: DleStateFile;
  today: string;
  number: number;
  answer: DleDeputy;
  stateName: string;
}) {
  const storageKey = `dle:${data.state}:${today}`;
  const attributes = useMemo(() => dleAttributes(data.federations), [data.federations]);
  const byId = useMemo(() => new Map(data.deputies.map((d) => [d.id, d])), [data.deputies]);
  const maxGuesses = maxGuessesFor(data.deputies.length);
  const [day, setDay] = useState<DayState>({ guesses: [], hint: false });
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [fresh, setFresh] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const revealRef = useRef<HTMLHeadingElement>(null);
  const listId = useId();

  useEffect(() => {
    setDay(readStored(storageKey, parseDayState, { guesses: [], hint: false }));
    setStats(readStored("dle:estatisticas", parseStats, EMPTY_STATS));
    setLoaded(true);
  }, [storageKey]);

  const guesses = day.guesses.map((id) => byId.get(id)).filter((d): d is DleDeputy => !!d);
  const won = guesses.some((g) => g.id === answer.id);
  const finished = won || guesses.length >= maxGuesses;
  const rows = guesses.map((g) => compareAll(attributes, dleValues(g), dleValues(answer)));
  const guessedNames = new Set(guesses.map((g) => g.name));
  const suggestions = finished ? [] : searchNames(data.deputies, query, guessedNames);

  const update = (next: DayState) => {
    setDay(next);
    writeStored(storageKey, next);
    const nextGuesses = next.guesses.length;
    const nowWon = next.guesses.includes(answer.id);
    if (nowWon || nextGuesses >= maxGuesses) {
      const updated = recordDay(stats, today, nowWon, nowWon ? String(nextGuesses) : "X");
      setStats(updated);
      writeStored("dle:estatisticas", updated);
    }
  };

  const guess = (deputy: DleDeputy) => {
    if (finished || day.guesses.includes(deputy.id)) return;
    playSound(deputy.id === answer.id ? "seal" : "paper");
    setFresh(true);
    update({ ...day, guesses: [...day.guesses, deputy.id] });
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };

  // Ao terminar, o foco vai para a pasta aberta (os campos de chute somem).
  useEffect(() => {
    if (fresh && finished) revealRef.current?.focus();
  }, [fresh, finished]);

  if (!loaded) return null;

  const shareText = dleShareText({
    number,
    state: data.state,
    rows,
    won,
    maxGuesses,
    url: `${window.location.origin}/jogos/dle`,
  });

  // Pistas já confirmadas (alguma ficha acertou o atributo): vão para a pasta secreta.
  const known = attributes.map((attribute, i) => {
    const index = rows.findIndex((row) => row[i]?.status === "hit");
    return index >= 0
      ? displayValue(attribute.key, dleValues(guesses[index]!)[attribute.key] ?? null)
      : null;
  });

  const badge = (
    <Badge
      items={[
        ["jogos", stats.played],
        ["acertos", stats.completed],
        ["sequência", currentStreak(stats, today)],
        ["maior sequência", stats.maxStreak],
      ]}
    />
  );

  return (
    <div className="mt-5">
      <Desk label={`Arquivo · Dle ${data.state} #${number}`} aside={badge}>
        <DeskNote className="font-sans text-sm font-bold">
          {formatDay(today)} · {data.deputies.length} deputados de {stateName} · {guesses.length} de{" "}
          {maxGuesses} fichas puxadas
        </DeskNote>

        {finished ? (
          <section
            className={`folder folder-open mt-6${fresh ? " sheet-slide" : ""}`}
            aria-live="polite"
            aria-labelledby="dle-revelacao"
          >
            <p className="folder-tab">
              Pasta aberta · Dle {data.state} #{number}
            </p>
            <ExtraBanner>Edição extra</ExtraBanner>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="halftone h-32 w-24 rounded">
                <img
                  src={`https://www.camara.leg.br/internet/deputado/bandep/${answer.id}.jpg`}
                  alt={`Foto de ${answer.name}`}
                  width={96}
                  height={128}
                />
              </div>
              <div>
                <h2
                  id="dle-revelacao"
                  ref={revealRef}
                  tabIndex={-1}
                  className="m-0 font-display text-2xl font-[750]"
                >
                  {won ? "Acertou: " : "Era "}
                  {answer.name}
                </h2>
                <p className="m-0 mt-1">
                  {answer.party} · {stateName}
                </p>
                <p className="m-0 mt-1">
                  <a href={`/deputados/${answer.id}`}>Ver a ficha completa</a>
                </p>
                <p className="caption m-0">Foto: Câmara dos Deputados</p>
              </div>
            </div>
            <ShareButton text={shareText} />
            <p className="caption m-0 mt-3">
              Amanhã tem outro deputado do dia. Experimente outro estado também.
            </p>
          </section>
        ) : (
          <section className="folder mt-6" aria-labelledby={`${listId}-pasta`}>
            <p className="folder-tab">
              Confidencial · Dle {data.state} #{number}
            </p>
            <h2 id={`${listId}-pasta`} className="m-0 font-display text-xl font-[720]">
              Ficha secreta: o deputado do dia de {stateName}
            </h2>
            <dl className="folder-clues" aria-label="Pistas confirmadas">
              {attributes.map((attribute, i) => (
                <div key={attribute.key}>
                  <dt>{attribute.label}</dt>
                  <dd>{known[i] ?? <span aria-label="ainda sem pista">?</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="relative mt-4 max-w-md">
              <label htmlFor={`${listId}-input`} className="block font-sans text-sm font-semibold">
                Puxe a ficha de um deputado de {stateName}
              </label>
              <input
                ref={inputRef}
                id={`${listId}-input`}
                type="text"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  suggestions[active] ? `${listId}-${suggestions[active]!.id}` : undefined
                }
                autoComplete="off"
                className="mt-1 min-h-11 w-full rounded border border-ink bg-sheet px-3 font-sans text-base text-ink"
                placeholder="Digite um nome"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((i) => Math.min(i + 1, suggestions.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((i) => Math.max(i - 1, 0));
                  } else if (event.key === "Enter" && suggestions[active]) {
                    event.preventDefault();
                    guess(suggestions[active]!);
                  } else if (event.key === "Escape") {
                    setQuery("");
                  }
                }}
              />
              {suggestions.length > 0 ? (
                <ul
                  id={listId}
                  role="listbox"
                  aria-label="Deputados do estado"
                  className="absolute z-10 mt-1 max-h-72 w-full list-none overflow-y-auto rounded border border-ink bg-sheet p-0 shadow-md"
                >
                  {suggestions.map((s, index) => (
                    <li
                      key={s.id}
                      id={`${listId}-${s.id}`}
                      role="option"
                      aria-selected={index === active}
                      className={`cursor-pointer px-3 py-2 font-sans text-sm ${index === active ? "bg-ink text-paper" : ""}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        guess(s);
                      }}
                      onMouseEnter={() => setActive(index)}
                    >
                      {s.name} <span className="opacity-75">({s.party})</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {guesses.length > 0 ? (
              <div className="mt-3">
                {day.hint ? (
                  <HintPhoto id={answer.id} />
                ) : (
                  <button
                    type="button"
                    className="game-button game-button-ghost game-button-small"
                    onClick={() => update({ ...day, hint: true })}
                  >
                    Ver dica: foto borrada
                  </button>
                )}
              </div>
            ) : null}
          </section>
        )}

        <ol className="mt-6 grid list-none gap-4 p-0" aria-label="Fichas puxadas">
          {guesses
            .map((g, index) => ({ g, row: rows[index]!, index }))
            .reverse()
            .map(({ g, row, index }) => (
              <li
                key={g.id}
                className={`index-card ${index % 2 ? "sheet-tilt-r" : "sheet-tilt-l"}${
                  fresh && index === guesses.length - 1 ? " sheet-in" : ""
                }`}
              >
                <p className="index-card-head">
                  <span className="index-card-number">Ficha {index + 1}</span>
                  <span className="font-display text-lg font-[720]">{g.name}</span>
                </p>
                <div className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-7">
                  {row.map((item, i) => {
                    const attribute = attributes[i]!;
                    const value = dleValues(g)[attribute.key] ?? null;
                    const arrow =
                      item.direction === "up" ? "↑" : item.direction === "down" ? "↓" : "";
                    return (
                      <div key={item.key} className={`tile tile-tab tile-flip tile-${item.status}`}>
                        <span className="text-[0.6rem] font-semibold uppercase">
                          {attribute.label}
                        </span>
                        <span>{displayValue(attribute.key, value)}</span>
                        <span className="tile-symbol" aria-hidden="true">
                          {arrow || SYMBOL[item.status]}
                        </span>
                        <span className="visually-hidden">
                          {STATUS_TEXT[item.status]}
                          {item.direction === "up"
                            ? ", o do dia é maior"
                            : item.direction === "down"
                              ? ", o do dia é menor"
                              : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
        </ol>

        <Legend />
      </Desk>
    </div>
  );
}

function HintPhoto({ id }: { id: number }) {
  return (
    <figure className="m-0 inline-block">
      <img
        src={`https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg`}
        alt="Dica: foto borrada do deputado do dia"
        width={72}
        height={96}
        className="h-24 w-[4.5rem] rounded object-cover"
        style={{ filter: "blur(9px) grayscale(1)" }}
      />
      <figcaption className="caption">Dica: foto borrada</figcaption>
    </figure>
  );
}

function Legend() {
  return (
    <ul className="m-0 mt-5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-sans text-xs text-on-desk">
      <li>
        <span className="legend-swatch tile-hit">✓</span> igual
      </li>
      <li>
        <span className="legend-swatch tile-near">≈</span> perto ou algo em comum
      </li>
      <li>
        <span className="legend-swatch tile-miss">✗</span> diferente
      </li>
      <li>↑ ↓ o número do deputado do dia é maior / menor</li>
    </ul>
  );
}
