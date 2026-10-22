// "Monte seu ranking" (ilha React). Quem escolhe métricas, pesos e direções é o leitor; o site
// não sugere nada (ADR 0010). Cálculo no navegador com as funções puras de @extrapolar/metrics.
import { useEffect, useMemo, useState } from "react";
import {
  MAX_WEIGHT,
  buildRanking,
  parseCriteria,
  serializeCriteria,
  type RankingCriterion,
  type RankingDirection,
} from "@extrapolar/metrics";
import type { RankingData, RankingMetric } from "../../lib/ranking";
import { copyText } from "../../lib/games/storage";

interface Props {
  states: { code: string; name: string }[];
  cadernoLabels: Record<string, string>;
}

/** Uma métrica escolhida: peso e direção começam vazios (sem padrão). */
interface Draft {
  key: string;
  weight: number | null;
  direction: RankingDirection | null;
}

/** Tons de tinta para as faixas de cada métrica (só para distinguir, não para avaliar). */
const SHADES = ["1", "0.72", "0.5", "0.34", "0.2"];
const shade = (index: number) => SHADES[index % SHADES.length]!;
const hatched = (index: number) => index >= SHADES.length;

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatValue(metric: RankingMetric, value: number): string {
  if (metric.unit === "proporcao") return `${oneDecimal.format(value * 100)}%`;
  if (metric.unit === "reais") return money.format(value);
  return integer.format(value);
}

function readUrl(known: Set<string>): { drafts: Draft[]; state: string; party: string } {
  const params = new URLSearchParams(window.location.search);
  const drafts = parseCriteria(params.get("m") ?? "", known).map((c) => ({ ...c }));
  return { drafts, state: params.get("uf") ?? "", party: params.get("partido") ?? "" };
}

export default function RankingBuilder({ states, cadernoLabels }: Props) {
  const [data, setData] = useState<RankingData | null>(null);
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [state, setState] = useState("");
  const [party, setParty] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<"" | "ok" | "falhou">("");

  useEffect(() => {
    fetch("/ranking/dados.json")
      .then((r) =>
        r.ok ? (r.json() as Promise<RankingData>) : Promise.reject(new Error(String(r.status))),
      )
      .then((d) => {
        const initial = readUrl(new Set(d.metrics.map((m) => m.key)));
        setDrafts(initial.drafts);
        setState(d.deputies.some((x) => x.state === initial.state) ? initial.state : "");
        setParty(d.deputies.some((x) => x.party === initial.party) ? initial.party : "");
        setData(d);
      })
      .catch(() => setError(true));
  }, []);

  const complete: RankingCriterion[] = drafts.filter(
    (d): d is RankingCriterion => d.weight !== null && d.direction !== null,
  );

  // Critérios e filtros na URL ("veja o meu ranking").
  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams();
    if (complete.length > 0) params.set("m", serializeCriteria(complete));
    if (state) params.set("uf", state);
    if (party) params.set("partido", party);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    setCopied("");
  }, [data, drafts, state, party]);

  const result = useMemo(() => {
    if (!data) return null;
    const values: Record<string, Map<number, number>> = {};
    for (const metric of data.metrics) {
      const map = new Map<number, number>();
      data.values[metric.key]!.forEach((v, i) => {
        if (v !== null) map.set(data.deputies[i]!.id, v);
      });
      values[metric.key] = map;
    }
    const ids = data.deputies
      .filter((d) => (!state || d.state === state) && (!party || d.party === party))
      .map((d) => d.id);
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    const names = new Map(data.deputies.map((d) => [d.id, d.name]));
    return buildRanking({
      criteria: complete,
      values,
      ids,
      tieBreak: (a, b) => collator.compare(names.get(a) ?? "", names.get(b) ?? ""),
    });
  }, [data, drafts, state, party]);

  if (error) return <p role="alert">Não deu para carregar os dados. Recarregue a página.</p>;
  if (!data || !result) return <p className="caption">Carregando as métricas…</p>;

  const metricByKey = new Map(data.metrics.map((m) => [m.key, m]));
  const indexOf = new Map(data.deputies.map((d, i) => [d.id, i]));
  const deputyById = new Map(data.deputies.map((d) => [d.id, d]));
  const parties = [...new Set(data.deputies.map((d) => d.party))].sort();
  const activeOrder = result.activeKeys;
  const update = (key: string, change: Partial<Draft>) =>
    setDrafts(drafts.map((d) => (d.key === key ? { ...d, ...change } : d)));
  const toggle = (key: string) =>
    setDrafts(
      drafts.some((d) => d.key === key)
        ? drafts.filter((d) => d.key !== key)
        : [...drafts, { key, weight: null, direction: null }],
    );
  const byCaderno = new Map<string, RankingMetric[]>();
  for (const m of data.metrics) byCaderno.set(m.caderno, [...(byCaderno.get(m.caderno) ?? []), m]);
  const shown = showAll ? result.ranked : result.ranked.slice(0, 50);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-labelledby="rk-criterios">
        <h2 id="rk-criterios" className="font-display text-2xl font-[750]">
          1. Seus critérios
        </h2>
        <p className="caption m-0">
          Marque as métricas que importam para você. Para cada uma, dê um peso de 0 a 5 e diga o que
          deve subir na lista: o valor maior ou o menor. Nada vem marcado.
        </p>
        {[...byCaderno.entries()].map(([caderno, metrics]) => (
          <fieldset key={caderno} className="m-0 mt-5 border-0 p-0">
            <legend className="kicker">{cadernoLabels[caderno] ?? caderno}</legend>
            {metrics.map((metric) => {
              const draft = drafts.find((d) => d.key === metric.key);
              const id = `rk-${metric.key}`;
              return (
                <div key={metric.key} className="border-t border-rule py-3">
                  <label htmlFor={id} className="flex cursor-pointer items-start gap-2">
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-1.5 size-5 shrink-0 accent-[var(--color-accent-strong)]"
                      checked={!!draft}
                      onChange={() => toggle(metric.key)}
                    />
                    <span>
                      <span className="font-semibold">{metric.label}</span>
                      <span className="caption block">
                        O que é isso? {metric.whatIs}{" "}
                        <a href={`/metodologia#${metric.anchor}`}>Metodologia</a>
                      </span>
                    </span>
                  </label>
                  {draft ? (
                    <div className="mt-2 ml-7 space-y-2">
                      <div
                        role="radiogroup"
                        aria-label={`Peso de ${metric.label}`}
                        className="flex flex-wrap items-center gap-1"
                      >
                        <span className="kicker mr-1">Peso</span>
                        {Array.from({ length: MAX_WEIGHT + 1 }, (_, w) => (
                          <button
                            key={w}
                            type="button"
                            role="radio"
                            aria-checked={draft.weight === w}
                            className="choice min-h-9 min-w-9 px-2"
                            onClick={() => update(metric.key, { weight: w })}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                      <div
                        role="radiogroup"
                        aria-label={`Direção de ${metric.label}`}
                        className="flex flex-wrap gap-1"
                      >
                        {(
                          [
                            ["more", "Maior sobe na lista"],
                            ["less", "Menor sobe na lista"],
                          ] as const
                        ).map(([direction, text]) => (
                          <button
                            key={direction}
                            type="button"
                            role="radio"
                            aria-checked={draft.direction === direction}
                            className="choice min-h-9 px-3 text-sm"
                            onClick={() => update(metric.key, { direction })}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                      {draft.weight === null || draft.direction === null ? (
                        <p className="caption m-0">
                          Escolha o peso e a direção para esta métrica entrar.
                        </p>
                      ) : draft.weight === 0 ? (
                        <p className="caption m-0">Peso 0: fica de fora da nota.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
        ))}
      </section>

      <section aria-labelledby="rk-resultado" className="min-w-0">
        <h2 id="rk-resultado" className="font-display text-2xl font-[750]">
          2. O seu ranking
        </h2>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <span className="kicker">Estado</span>
            <select
              className="min-h-11 rounded border border-ink bg-paper px-2 font-sans text-ink"
              value={state}
              onChange={(e) => setState(e.target.value)}
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

        {activeOrder.length === 0 ? (
          <div className="clipping mt-4">
            <p className="m-0 font-display text-xl font-[700]">Ainda não há critério.</p>
            <p className="m-0 mt-1">
              Marque ao menos uma métrica, com peso de 1 a 5 e direção, e a lista aparece aqui. Cada
              métrica vira um percentil (de 0 a 100, entre os deputados com dado) para que reais e
              porcentagens possam ser somados; a nota é a média desses percentis com os seus pesos.
            </p>
          </div>
        ) : (
          <>
            <ul
              className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-sans text-xs"
              aria-label="Legenda das faixas"
            >
              {activeOrder.map((key, i) => (
                <li key={key} className="flex items-center gap-1">
                  <Swatch index={i} /> {metricByKey.get(key)?.label}
                </li>
              ))}
            </ul>
            <p className="caption mt-2" aria-live="polite">
              {integer.format(result.ranked.length)} deputados classificados
              {result.excluded.length > 0
                ? `; ${integer.format(result.excluded.length)} fora por falta de dado (lista abaixo)`
                : ""}
              .
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="game-button game-button-small"
                onClick={async () =>
                  setCopied((await copyText(window.location.href)) ? "ok" : "falhou")
                }
              >
                Copiar o link do meu ranking
              </button>
              <span className="caption" aria-live="polite">
                {copied === "ok"
                  ? "Link copiado."
                  : copied === "falhou"
                    ? "Copie o endereço da barra do navegador."
                    : ""}
              </span>
            </div>
            <ol className="m-0 mt-4 list-none p-0">
              {shown.map((row) => {
                const d = deputyById.get(row.id)!;
                const i = indexOf.get(row.id)!;
                const smallIn = activeOrder.filter((key) => data.small[key]![i] === "1");
                return (
                  <li key={row.id} className="border-t border-rule py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="m-0">
                        <span className="font-display text-xl font-[750] tabular-nums">
                          {row.position}º
                        </span>{" "}
                        <a href={`/deputados/${row.id}`} className="font-semibold">
                          {d.name}
                        </a>{" "}
                        <span className="caption">
                          {d.party} · {d.state}
                        </span>
                      </p>
                      <p className="m-0 font-sans text-sm whitespace-nowrap">
                        nota <strong>{oneDecimal.format(row.score)}</strong>
                      </p>
                    </div>
                    <div
                      className="stack-bar mt-1.5"
                      role="img"
                      aria-label={`Nota ${oneDecimal.format(row.score)} de 100`}
                    >
                      {row.contributions.map((c, ci) => (
                        <span
                          key={c.key}
                          style={{
                            width: `${c.points}%`,
                            background: hatched(ci)
                              ? `repeating-linear-gradient(135deg, var(--color-ink) 0 2px, transparent 2px 5px)`
                              : "var(--color-ink)",
                            opacity: shade(ci),
                          }}
                        />
                      ))}
                    </div>
                    <details className="mt-1">
                      <summary className="caption cursor-pointer">
                        Quanto cada métrica somou
                      </summary>
                      <ul className="m-0 mt-1 list-none p-0 font-sans text-sm">
                        {row.contributions.map((c, ci) => {
                          const metric = metricByKey.get(c.key)!;
                          const value = data.values[c.key]![i]!;
                          return (
                            <li key={c.key} className="flex items-center gap-2 py-0.5">
                              <Swatch index={ci} />
                              <span>
                                {metric.label}: {formatValue(metric, value)} · percentil na sua
                                direção {integer.format(c.percentile * 100)} → +
                                {oneDecimal.format(c.points)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                    {smallIn.length > 0 ? (
                      <p className="caption m-0">
                        Base pequena (menos de 30) em:{" "}
                        {smallIn.map((k) => metricByKey.get(k)?.label).join(", ")}.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {result.ranked.length > 50 ? (
              <button
                type="button"
                className="game-button game-button-ghost game-button-small mt-2"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? "Mostrar só os 50 primeiros"
                  : `Mostrar todos (${integer.format(result.ranked.length)})`}
              </button>
            ) : null}

            {result.excluded.length > 0 ? (
              <section className="mt-8" aria-labelledby="rk-fora">
                <h3 id="rk-fora" className="font-display text-xl font-[700]">
                  Fora da classificação: sem dado
                </h3>
                <p className="caption m-0">
                  "Sem dado" não é zero: quem não tem o dado numa métrica escolhida fica fora, com o
                  motivo.
                </p>
                <ul className="m-0 mt-2 list-none p-0">
                  {result.excluded.map((e) => {
                    const d = deputyById.get(e.id)!;
                    const i = indexOf.get(e.id)!;
                    return (
                      <li key={e.id} className="border-t border-rule py-2">
                        <a href={`/deputados/${e.id}`} className="font-semibold">
                          {d.name}
                        </a>{" "}
                        <span className="caption">
                          {d.party} · {d.state}
                        </span>
                        <ul className="m-0 list-none p-0 text-sm">
                          {e.missing.map((key) => {
                            const reason = data.reasons[key]![i];
                            return (
                              <li key={key}>
                                {metricByKey.get(key)?.label}:{" "}
                                {reason ? (data.reasonTexts[reason] ?? reason) : "sem dado."}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Swatch({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3 rounded-sm border border-ink"
      style={{
        background: hatched(index)
          ? "repeating-linear-gradient(135deg, var(--color-ink) 0 2px, transparent 2px 5px)"
          : "var(--color-ink)",
        opacity: shade(index),
      }}
    />
  );
}
