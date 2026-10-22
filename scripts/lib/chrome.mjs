// Controle do Chrome headless pelo protocolo DevTools, usado pelos scripts de capturas e de acessibilidade.
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROFILE = join(ROOT, ".chrome-profile");
const PORT = 9333;

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome ainda abrindo
    }
    await wait(200);
  }
  throw new Error("Não foi possível conectar ao Chrome.");
}

export function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method) {
      for (const listener of listeners) listener(message);
    }
  });
  return {
    send(method, params = {}) {
      const messageId = ++id;
      ws.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
    },
    once(method) {
      return new Promise((resolve) => {
        const listener = (message) => {
          if (message.method === method) {
            listeners.splice(listeners.indexOf(listener), 1);
            resolve(message.params);
          }
        };
        listeners.push(listener);
      });
    },
  };
}

/** Abre o Chrome headless, entrega uma página controlável e fecha tudo no fim (apagando o perfil). */
export async function withChrome(task) {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      `--user-data-dir=${PROFILE}`,
      `--remote-debugging-port=${PORT}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  try {
    const ws = new WebSocket(await connect());
    await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
    const page = cdp(ws);
    await page.send("Page.enable");
    try {
      return await task(page);
    } finally {
      ws.close();
    }
  } finally {
    chrome.kill();
    await wait(300);
    await rm(PROFILE, { recursive: true, force: true });
  }
}

/** Navega e espera o carregamento (mais um tempo para fontes e imagens). */
export async function open(page, url, extraWaitMs = 600) {
  const loaded = page.once("Page.loadEventFired");
  await page.send("Page.navigate", { url });
  await loaded;
  await wait(extraWaitMs);
}

/** Avalia uma expressão na página e devolve o valor. */
export async function evaluate(page, expression) {
  const { result, exceptionDetails } = await page.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description ?? "erro no script");
  return result.value;
}
