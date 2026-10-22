// Cliente HTTP educado com a Câmara: poucas requisições simultâneas, pausa
// mínima entre elas e novas tentativas com espera crescente.

export interface HttpClientOptions {
  /** Requisições simultâneas no máximo. */
  concurrency?: number;
  /** Intervalo mínimo entre o início de duas requisições (ms). */
  minIntervalMs?: number;
  /** Tentativas extras depois da primeira. */
  maxRetries?: number;
  /** Espera antes da primeira nova tentativa (ms); dobra a cada tentativa. */
  baseDelayMs?: number;
  /** Tempo máximo de uma requisição (ms). */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  onRetry?: (info: { url: string; attempt: number; delayMs: number; reason: string }) => void;
}

export class HttpError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Status que valem nova tentativa: excesso de requisições e erros do servidor. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export class HttpClient {
  private readonly concurrency: number;
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly onRetry: HttpClientOptions["onRetry"];

  private active = 0;
  private readonly waiting: Array<() => void> = [];
  private nextStartAt = 0;

  constructor(options: HttpClientOptions = {}) {
    this.concurrency = options.concurrency ?? 2;
    this.minIntervalMs = options.minIntervalMs ?? 250;
    this.maxRetries = options.maxRetries ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.onRetry = options.onRetry;
  }

  /** Faz a requisição com fila, pausa e novas tentativas. Lança HttpError em falha definitiva. */
  async request(url: string, init: RequestInit = {}): Promise<Response> {
    let attempt = 0;
    for (;;) {
      let reason: string;
      try {
        const response = await this.withSlot(() => this.fetchWithTimeout(url, init));
        if (response.ok) return response;
        if (!isRetryableStatus(response.status)) {
          throw new HttpError(url, response.status, `HTTP ${response.status} em ${url}`);
        }
        reason = `HTTP ${response.status}`;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        reason = error instanceof Error ? error.message : String(error);
      }

      if (attempt >= this.maxRetries) {
        throw new HttpError(
          url,
          0,
          `Falha ao acessar ${url} depois de ${attempt + 1} tentativa(s): ${reason}`,
        );
      }
      const delayMs = this.baseDelayMs * 2 ** attempt;
      attempt++;
      this.onRetry?.({ url, attempt, delayMs, reason });
      await this.sleep(delayMs);
    }
  }

  async getJson(url: string): Promise<unknown> {
    const response = await this.request(url, { headers: { Accept: "application/json" } });
    return response.json();
  }

  /** Retorna o cabeçalho Last-Modified (ou null). */
  async headLastModified(url: string): Promise<string | null> {
    const response = await this.request(url, { method: "HEAD" });
    return response.headers.get("last-modified");
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Garante o limite de simultaneidade e o intervalo mínimo entre inícios. */
  private async withSlot<T>(task: () => Promise<T>): Promise<T> {
    if (this.active < this.concurrency) {
      this.active++;
    } else {
      // A vaga é passada direto por quem terminar (ver finally), sem disputa.
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    try {
      const startAt = Math.max(this.now(), this.nextStartAt);
      this.nextStartAt = startAt + this.minIntervalMs;
      const wait = startAt - this.now();
      if (wait > 0) await this.sleep(wait);
      return await task();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }
}

/** Executa `task` para cada item com no máximo `limit` em paralelo, preservando a ordem do resultado. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index] as T, index);
    }
  });
  await Promise.all(workers);
  return results;
}
