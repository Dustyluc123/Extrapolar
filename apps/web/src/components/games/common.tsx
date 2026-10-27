// Peças comuns das ilhas dos jogos: dia de Brasília, estatísticas, compartilhar, aviso de privacidade.
import { useEffect, useState, type ReactNode } from "react";
import { brasiliaDateKey, currentStreak, msUntilNextDay, type GameStats } from "@extrapolar/games";
import { copyText } from "../../lib/games/storage";

/** Data de hoje em Brasília; atualiza sozinha à meia-noite. Null até montar no navegador. */
export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setToday(brasiliaDateKey(now));
      timer = setTimeout(tick, msUntilNextDay(now) + 1000);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return today;
}

export function PrivacyNote() {
  return (
    <p className="caption m-0 mt-2">
      Suas respostas ficam só neste aparelho e nunca são enviadas.{" "}
      <a href="/sobre#privacidade">Privacidade</a>
    </p>
  );
}

export function ExtraBanner({ children }: { children: ReactNode }) {
  return <p className="extra-banner m-0">{children}</p>;
}

export function StatsLine({
  stats,
  today,
  label,
}: {
  stats: GameStats;
  today: string;
  label?: string;
}) {
  const items: [string, number][] = [
    ["jogos", stats.played],
    [label ?? "completos", stats.completed],
    ["sequência", currentStreak(stats, today)],
    ["maior sequência", stats.maxStreak],
  ];
  return (
    <dl className="m-0 mt-4 grid grid-cols-4 gap-2 text-center">
      {items.map(([name, value]) => (
        <div key={name} className="border-t border-rule pt-2">
          <dt className="kicker text-[0.62rem]">{name}</dt>
          <dd className="m-0 font-display text-2xl font-[750]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Botão de compartilhar: usa o menu do celular ou copia; se nada der certo, mostra o texto. */
export function ShareButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="mt-4">
      <button
        type="button"
        className="game-button"
        onClick={async () => setStatus((await copyText(text)) ? "copied" : "failed")}
      >
        Compartilhar resultado
      </button>
      <p className="caption m-0 mt-1" aria-live="polite">
        {status === "copied" ? "Pronto! Resultado copiado (sem a resposta)." : ""}
      </p>
      {status === "failed" ? (
        <pre className="mt-2 overflow-x-auto rounded border border-rule bg-card p-2 text-sm whitespace-pre-wrap">
          {text}
        </pre>
      ) : null}
    </div>
  );
}

/** Aviso quando o site está desatualizado e o desafio do dia ainda não saiu. */
export function NotPublishedYet({ lastDate }: { lastDate: string | null }) {
  return (
    <div className="clipping mt-4">
      <p className="m-0 font-display text-xl font-[700]">
        O desafio de hoje ainda não saiu nesta edição.
      </p>
      <p className="m-0 mt-1">
        Os dados do site são atualizados uma vez por dia.
        {lastDate ? ` O último desafio publicado é de ${formatDay(lastDate)}.` : ""} Volte mais
        tarde.
      </p>
    </div>
  );
}

const longDay = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const fullDay = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "22 de outubro" (ou com o ano). */
export function formatDay(dateKey: string, withYear = false): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return (withYear ? fullDay : longDay).format(date);
}

export const formatInt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
export const formatPct = (n: number, digits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n) + "%";

/** Seletor de estado (lembrado entre os jogos). */
export function StatePicker({
  states,
  value,
  onChange,
  id,
  label = "Seu estado",
}: {
  states: { code: string; name: string }[];
  value: string | null;
  onChange: (code: string) => void;
  id: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="kicker">
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 rounded border border-ink bg-paper px-2 font-sans text-base text-ink"
        value={value ?? ""}
        onChange={(event) => event.target.value && onChange(event.target.value)}
      >
        <option value="">Escolha…</option>
        {states.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
