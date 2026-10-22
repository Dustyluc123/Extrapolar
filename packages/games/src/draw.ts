/**
 * Sorteio diário (adaptado do Chutaí — ADR 0020).
 *
 * - Os dias são contados a partir do primeiro dia do sorteio, em ciclos. Cada ciclo passa por
 *   todos os itens que já estavam na lista ("roster") quando o ciclo começou, sem repetir.
 * - A ordem dentro de cada ciclo vem de `rank(ciclo, id)`, que no pipeline é um HMAC com a chave
 *   secreta do sorteio. Sem a chave, ninguém prevê a ordem.
 * - Item novo entra no roster com a data em que passa a valer e só aparece no ciclo seguinte:
 *   o ciclo atual (e portanto hoje e os dias já jogados) não muda.
 * - Item que saiu (ex.: deputado que deixou o exercício) continua no roster, para a contagem dos
 *   ciclos não mudar; se for sorteado, vale o próximo da ordem que ainda está disponível.
 */
import { addDays, daysBetween } from "./day";

export interface RosterEntry {
  id: string;
  /** Data (AAAA-MM-DD) a partir da qual o item pode ser sorteado. */
  since: string;
}

export interface DailyPickInput {
  dateKey: string;
  roster: readonly RosterEntry[];
  /** Ordem secreta de um item num ciclo (menor sai primeiro). */
  rank: (cycle: number, id: string) => string;
  /** Ids que podem ser sorteados hoje. Se o sorteado não estiver aqui, vale o próximo da ordem. */
  available?: ReadonlySet<string>;
}

/** Primeiro dia com itens no roster, ou null se estiver vazio. */
export function drawStartDate(roster: readonly RosterEntry[]): string | null {
  if (roster.length === 0) return null;
  return roster.reduce((min, entry) => (entry.since < min ? entry.since : min), roster[0]!.since);
}

/** Id sorteado para o dia, ou null se o sorteio ainda não começou ou não há disponível. */
export function dailyPick(input: DailyPickInput): string | null {
  const start = drawStartDate(input.roster);
  if (!start || input.dateKey < start) return null;
  const target = daysBetween(start, input.dateKey);
  let cycleStart = 0;
  for (let cycle = 0; ; cycle++) {
    const startKey = addDays(start, cycleStart);
    const members = input.roster
      .filter((entry) => entry.since <= startKey)
      .map((entry) => ({ id: entry.id, rank: input.rank(cycle, entry.id) }))
      .sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.id < b.id ? -1 : 1));
    if (target < cycleStart + members.length) {
      const position = target - cycleStart;
      for (let offset = 0; offset < members.length; offset++) {
        const candidate = members[(position + offset) % members.length]!;
        if (!input.available || input.available.has(candidate.id)) return candidate.id;
      }
      return null;
    }
    cycleStart += members.length;
  }
}

/**
 * Atualiza o roster com os ids atuais: quem é novo entra com `since` = `today` (só aparece no
 * próximo ciclo); quem já estava continua igual, mesmo que tenha saído.
 */
export function updateRoster(
  roster: readonly RosterEntry[],
  currentIds: readonly string[],
  today: string,
): RosterEntry[] {
  const known = new Set(roster.map((entry) => entry.id));
  const added = currentIds
    .filter((id) => !known.has(id))
    .sort()
    .map((id) => ({ id, since: today }));
  return [...roster, ...added];
}

/**
 * Embaralha a resposta de um dia para ela não aparecer num olhar casual no JSON (XOR com a data
 * + base64). Não é segredo: quem ler o código consegue desfazer (ver ADR 0020).
 */
/** Chave do embaralhamento: a data de trás para frente (o dia muda os primeiros bytes). */
function scrambleKey(dateKey: string): Uint8Array {
  return new TextEncoder().encode(`${[...dateKey].reverse().join("")}:extrapolar`);
}

export function scramble(value: string, dateKey: string): string {
  const bytes = new TextEncoder().encode(value);
  const key = scrambleKey(dateKey);
  const out = bytes.map((byte, i) => byte ^ key[i % key.length]!);
  let binary = "";
  for (const byte of out) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function unscramble(encoded: string, dateKey: string): string {
  const binary = atob(encoded);
  const key = scrambleKey(dateKey);
  const bytes = Uint8Array.from(binary, (char, i) => char.charCodeAt(0) ^ key[i % key.length]!);
  return new TextDecoder().decode(bytes);
}
