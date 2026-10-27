// Sons da mesa de votação, gerados na hora com a Web Audio API: nenhum arquivo, nenhuma licença
// (mesmo padrão do Chutaí). Regras:
// - desligado por padrão; a escolha fica em localStorage (extrapolar:jogos:som);
// - só toca depois de ligado e a partir de um toque ou tecla (play é chamado nos cliques);
// - nunca com a aba escondida; volume baixo;
// - o mesmo som para SIM e NÃO: o som não comenta a escolha.
import { useSyncExternalStore } from "react";
import { readStored, writeStored } from "./storage";

export type SoundName = "stamp" | "paper" | "panel" | "seal";

const KEY = "som";
const VOLUME = 0.22;

let enabled: boolean | null = null;
const listeners = new Set<() => void>();
let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function isEnabled(): boolean {
  if (enabled === null) enabled = readStored(KEY, (raw) => raw === true, false);
  return enabled;
}

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  writeStored(KEY, next);
  for (const listener of listeners) listener();
  if (next) playSound("paper");
}

/** Estado do som para os componentes (false no servidor e até montar). */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isEnabled,
    () => false,
  );
}

function audio(): AudioContext | null {
  try {
    if (!context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Ruído filtrado com envelope: batida (grave) ou papel (agudo, com varredura). */
function burst(
  ctx: AudioContext,
  at: number,
  length: number,
  filter: { type: BiquadFilterType; from: number; to?: number; q?: number },
  gain: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter.type;
  biquad.Q.value = filter.q ?? 1;
  biquad.frequency.setValueAtTime(filter.from, at);
  if (filter.to) biquad.frequency.exponentialRampToValueAtTime(filter.to, at + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain * VOLUME, at + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  source.connect(biquad).connect(env).connect(ctx.destination);
  source.start(at);
  source.stop(at + length + 0.02);
}

function tone(ctx: AudioContext, at: number, freq: number, length: number, gain: number) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, at + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain * VOLUME, at + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(env).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

function blip(ctx: AudioContext, at: number, freq: number) {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.35 * VOLUME, at + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  osc.connect(env).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.08);
}

export function playSound(name: SoundName): void {
  if (typeof window === "undefined" || !isEnabled() || document.hidden) return;
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime + 0.01;
  try {
    switch (name) {
      case "stamp":
        // Carimbo de borracha: baque grave + estalo curto.
        tone(ctx, now, 120, 0.16, 1.1);
        burst(ctx, now, 0.07, { type: "lowpass", from: 1400, q: 0.7 }, 0.9);
        break;
      case "seal":
        // Carimbo oficial da revelação: o mesmo baque, um pouco mais cheio.
        tone(ctx, now, 95, 0.24, 1.3);
        burst(ctx, now, 0.1, { type: "lowpass", from: 1100, q: 0.7 }, 1);
        break;
      case "paper":
        // Papel deslizando na mesa.
        burst(ctx, now, 0.32, { type: "bandpass", from: 2200, to: 5200, q: 0.8 }, 0.45);
        break;
      case "panel":
        // Painel acendendo: estalinhos rápidos de relé.
        for (let i = 0; i < 8; i++) blip(ctx, now + i * 0.045, 1500 + (i % 3) * 120);
        break;
    }
  } catch {
    // Sem som: o jogo segue igual.
  }
}
