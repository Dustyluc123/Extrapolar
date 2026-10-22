import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileCache } from "../src/lib/cache";
import { cachedComputed, fetchJsonCached } from "../src/lib/cached-fetch";
import { HttpClient } from "../src/lib/http";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "extrapolar-cache-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const HOUR = 60 * 60 * 1000;

function setup(lastModified = "Wed, 21 Oct 2026 06:51:58 GMT") {
  const calls: Array<{ url: string; method: string }> = [];
  let body = '{"versao":1}';
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET" });
    return new Response(init?.method === "HEAD" ? null : body, {
      status: 200,
      headers: { "last-modified": lastModified },
    });
  }) as unknown as typeof fetch;
  let clock = Date.parse("2026-10-22T03:00:00Z");
  const context = {
    client: new HttpClient({ fetchImpl, minIntervalMs: 0 }),
    cache: new FileCache(dir),
    refresh: false,
    ttlMs: 20 * HOUR,
    now: () => clock,
  };
  return {
    context,
    calls,
    advance: (ms: number) => (clock += ms),
    setBody: (value: string) => (body = value),
  };
}

describe("fetchJsonCached", () => {
  it("baixa na primeira vez e usa o cache dentro da validade", async () => {
    const { context, calls, advance } = setup();
    const first = await fetchJsonCached(context, "a.json", "https://x/a.json");
    expect(first.origin).toBe("baixado");
    advance(HOUR);
    const second = await fetchJsonCached(context, "a.json", "https://x/a.json");
    expect(second.origin).toBe("cache");
    expect(second.data).toEqual({ versao: 1 });
    expect(calls).toHaveLength(1);
  });

  it("confere o Last-Modified quando o cache vence e reaproveita se não mudou", async () => {
    const { context, calls, advance } = setup();
    await fetchJsonCached(context, "a.json", "https://x/a.json", { checkLastModified: true });
    advance(21 * HOUR);
    const result = await fetchJsonCached(context, "a.json", "https://x/a.json", {
      checkLastModified: true,
    });
    expect(result.origin).toBe("conferido");
    expect(calls.map((call) => call.method)).toEqual(["GET", "HEAD"]);
  });

  it("baixa de novo com refresh", async () => {
    const { context, calls, setBody } = setup();
    await fetchJsonCached(context, "a.json", "https://x/a.json");
    setBody('{"versao":2}');
    const result = await fetchJsonCached(
      { ...context, refresh: true },
      "a.json",
      "https://x/a.json",
    );
    expect(result.origin).toBe("baixado");
    expect(result.data).toEqual({ versao: 2 });
    expect(calls).toHaveLength(2);
  });

  it("falha com mensagem clara se a resposta não for JSON, sem gravar no cache", async () => {
    const { context, setBody } = setup();
    setBody("<html>manutenção</html>");
    await expect(fetchJsonCached(context, "a.json", "https://x/a.json")).rejects.toThrow(
      /não é um JSON válido/,
    );
    expect(await context.cache.read("a.json")).toBeNull();
  });

  it("tenta de novo quando a conexão cai no meio do corpo", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) {
        const broken = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"parc'));
            controller.error(new Error("conexão encerrada"));
          },
        });
        return new Response(broken, { status: 200 });
      }
      return new Response('{"ok":true}', { status: 200 });
    }) as unknown as typeof fetch;
    const context = {
      client: new HttpClient({ fetchImpl, minIntervalMs: 0 }),
      cache: new FileCache(dir),
      refresh: false,
    };
    const result = await fetchJsonCached(context, "b.json", "https://x/b.json");
    expect(result.data).toEqual({ ok: true });
    expect(calls).toBe(2);
  });
});

describe("cachedComputed", () => {
  const context = () => ({
    client: new HttpClient({ minIntervalMs: 0 }),
    cache: new FileCache(dir),
    refresh: false,
  });

  it("guarda o valor calculado e reaproveita dentro da validade", async () => {
    let calls = 0;
    const compute = async () => ({ n: ++calls });
    expect((await cachedComputed(context(), "c.json", "x", compute)).data).toEqual({ n: 1 });
    expect((await cachedComputed(context(), "c.json", "x", compute)).data).toEqual({ n: 1 });
  });

  it("recalcula quando o cache está num formato antigo", async () => {
    await cachedComputed(context(), "d.json", "x", async () => [1, 2]);
    const result = await cachedComputed(context(), "d.json", "x", async () => ({ items: [] }), {
      isValid: (data) => !Array.isArray(data),
    });
    expect(result.data).toEqual({ items: [] });
  });

  it("se o cálculo falhar, usa o valor antigo e avisa", async () => {
    await cachedComputed(context(), "e.json", "x", async () => ({ v: "antigo" }));
    const warnings: string[] = [];
    const result = await cachedComputed(
      context(),
      "e.json",
      "x",
      async () => {
        throw new Error("API fora do ar");
      },
      { ttlMs: 0, onStale: (reason) => warnings.push(reason) },
    );
    expect(result.data).toEqual({ v: "antigo" });
    expect(warnings).toEqual(["API fora do ar"]);
  });
});
