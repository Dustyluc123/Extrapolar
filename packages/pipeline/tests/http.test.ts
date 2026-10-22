import { describe, expect, it } from "vitest";
import { HttpClient, HttpError, mapWithConcurrency } from "../src/lib/http";

function fakeFetch(responses: Array<Response | Error>) {
  const calls: string[] = [];
  const impl = (async (url: string) => {
    calls.push(url);
    const next = responses.shift();
    if (!next) throw new Error("sem resposta preparada");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const noSleep = async () => {};

describe("HttpClient", () => {
  it("tenta de novo em 503 e 429 com espera crescente", async () => {
    const { impl, calls } = fakeFetch([
      new Response("", { status: 503 }),
      new Response("", { status: 429 }),
      new Response('{"ok":true}', { status: 200 }),
    ]);
    const delays: number[] = [];
    const client = new HttpClient({
      fetchImpl: impl,
      sleep: noSleep,
      baseDelayMs: 100,
      minIntervalMs: 0,
      onRetry: ({ delayMs }) => delays.push(delayMs),
    });
    await expect(client.getJson("https://x/a")).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(3);
    expect(delays).toEqual([100, 200]);
  });

  it("tenta de novo em erro de rede", async () => {
    const { impl } = fakeFetch([new Error("ECONNRESET"), new Response("[]", { status: 200 })]);
    const client = new HttpClient({ fetchImpl: impl, sleep: noSleep, minIntervalMs: 0 });
    await expect(client.getJson("https://x/a")).resolves.toEqual([]);
  });

  it("não tenta de novo em 404", async () => {
    const { impl, calls } = fakeFetch([new Response("", { status: 404 })]);
    const client = new HttpClient({ fetchImpl: impl, sleep: noSleep, minIntervalMs: 0 });
    await expect(client.getJson("https://x/a")).rejects.toThrow(HttpError);
    expect(calls).toHaveLength(1);
  });

  it("desiste depois do limite de tentativas com mensagem clara", async () => {
    const { impl, calls } = fakeFetch(
      Array.from({ length: 3 }, () => new Response("", { status: 500 })),
    );
    const client = new HttpClient({
      fetchImpl: impl,
      sleep: noSleep,
      minIntervalMs: 0,
      maxRetries: 2,
    });
    await expect(client.getJson("https://x/a")).rejects.toThrow(
      /depois de 3 tentativa\(s\): HTTP 500/,
    );
    expect(calls).toHaveLength(3);
  });

  it("respeita o limite de requisições simultâneas", async () => {
    let active = 0;
    let peak = 0;
    const impl = (async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const client = new HttpClient({ fetchImpl: impl, concurrency: 2, minIntervalMs: 0 });
    await Promise.all(Array.from({ length: 8 }, (_, i) => client.getJson(`https://x/${i}`)));
    expect(peak).toBe(2);
  });

  it("espera o intervalo mínimo entre o início das requisições", async () => {
    let clock = 0;
    const waits: number[] = [];
    const client = new HttpClient({
      fetchImpl: (async () => new Response("{}")) as unknown as typeof fetch,
      concurrency: 1,
      minIntervalMs: 250,
      now: () => clock,
      sleep: async (ms) => {
        waits.push(ms);
        clock += ms;
      },
    });
    await client.getJson("https://x/1");
    await client.getJson("https://x/2");
    await client.getJson("https://x/3");
    expect(waits).toEqual([250, 250]);
  });
});

describe("mapWithConcurrency", () => {
  it("preserva a ordem dos resultados", async () => {
    const result = await mapWithConcurrency([30, 10, 20], 2, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms * 2;
    });
    expect(result).toEqual([60, 20, 40]);
  });
});
