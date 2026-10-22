// Formatação de datas e números em português do Brasil.
// As datas da Câmara são locais (horário de Brasília) e sem fuso; para não deslocar o dia,
// elas são montadas em UTC e formatadas em UTC.

function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new Error(`Data inválida: "${value}"`);
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

const longDate = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "21 de outubro de 2026" */
export function formatLongDate(value: string): string {
  return longDate.format(parseLocalDate(value));
}

/** "21/10/2026" */
export function formatShortDate(value: string): string {
  return shortDate.format(parseLocalDate(value));
}

/** "Edição de quarta-feira, 21 de outubro de 2026" */
export function formatEditionDate(value: string): string {
  const date = parseLocalDate(value);
  return `Edição de ${weekday.format(date)}, ${longDate.format(date)}`;
}

/** "21/10/2026, às 14h05" */
export function formatDateTime(value: string): string {
  const time = /T(\d{2}):(\d{2})/.exec(value);
  const date = formatShortDate(value);
  return time ? `${date}, às ${time[1]}h${time[2]}` : date;
}

const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** "1.128" */
export function formatInteger(value: number): string {
  return integer.format(value);
}

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 0.8143 → "81,4%"; null → "sem dado". */
export function formatPercent(value: number | null): string {
  if (value === null) return "sem dado";
  // Intl usa espaço fino antes do %; no texto corrido preferimos sem espaço.
  return percent.format(value).replace(/\s/g, "");
}

/** Escolhe singular ou plural: plural(1, "votação", "votações") → "1 votação". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatInteger(count)} ${count === 1 ? singular : pluralForm}`;
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 1.234,56" (sem espaço especial entre R$ e o número). */
export function formatBRL(value: number): string {
  return brl.format(value).replace(/\s/g, " ");
}

const compact1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Valor compacto para gráficos e manchetes: "R$ 1,2 mi", "R$ 52,3 mil", "R$ 950". */
export function formatBRLCompact(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}R$ ${compact1.format(abs / 1_000_000_000)} bi`;
  if (abs >= 1_000_000) return `${sign}R$ ${compact1.format(abs / 1_000_000)} mi`;
  if (abs >= 1_000) return `${sign}R$ ${compact1.format(abs / 1_000)} mil`;
  return `${sign}R$ ${integer.format(Math.round(abs))}`;
}

/** Instante ISO com fuso (ex.: "2026-10-22T14:10:00.000Z") → "AAAA-MM-DDTHH:mm:ss" em Brasília. */
export function isoToBrasiliaLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}
