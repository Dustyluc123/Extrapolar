// Estado dos jogos no navegador do jogador (localStorage). Nada é enviado a lugar nenhum.
// Toda leitura e escrita fica em try/catch: em janela anônima, com dados bloqueados ou em
// prévias, o jogo funciona do mesmo jeito, só não lembra de um dia para o outro.

const PREFIX = "extrapolar:jogos:";

export function readStored<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Estado escolhido pelo jogador (lembrado entre os jogos). */
export const STATE_KEY = "estado";

export function parseState(raw: unknown, valid: readonly string[]): string | null {
  return typeof raw === "string" && valid.includes(raw) ? raw : null;
}

/** Copia o texto para a área de transferência; se não der, devolve false (a tela mostra o texto). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
