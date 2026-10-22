// Capturas de tela do site com o Chrome headless e emulação de celular (protocolo DevTools).
// Também confere se a página tem rolagem horizontal (erro de layout no celular).
//
// Uso:  pnpm build && pnpm --filter @extrapolar/web preview     (site em http://localhost:4321)
//       node scripts/screenshots.mjs / /deputados/204379
// Saída: docs/screenshots/<página>-<celular|desktop>-<claro|escuro>.png (fora do Git)
// O perfil temporário do Chrome fica em .chrome-profile/ (fora do Git) e é apagado no fim.
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const OUT = join(ROOT, "docs", "screenshots");
const PROFILE = join(ROOT, ".chrome-profile");
const PORT = 9333;

const VIEWS = [
  { name: "celular-claro", width: 390, height: 844, mobile: true, scheme: "light" },
  { name: "celular-escuro", width: 390, height: 844, mobile: true, scheme: "dark" },
  { name: "desktop-claro", width: 1280, height: 900, mobile: false, scheme: "light" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function cdp(ws) {
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

const paths = process.argv.slice(2);
if (paths.length === 0) paths.push("/");
await mkdir(OUT, { recursive: true });

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

let problems = 0;
try {
  const ws = new WebSocket(await connect());
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  const page = cdp(ws);
  await page.send("Page.enable");

  for (const path of paths) {
    const slug = path.replace(/^\//, "").replace(/\//g, "-") || "capa";
    for (const view of VIEWS) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        width: view.width,
        height: view.height,
        deviceScaleFactor: 2,
        mobile: view.mobile,
      });
      await page.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-color-scheme", value: view.scheme }],
      });
      const loaded = page.once("Page.loadEventFired");
      await page.send("Page.navigate", { url: BASE_URL + path });
      await loaded;
      await wait(600); // fontes e imagens

      const { result } = await page.send("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => {
          const doc = document.documentElement;
          const wide = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
            .slice(0, 5)
            .map((el) => el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ").slice(0, 3).join(".") : ""));
          return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, height: doc.scrollHeight, wide };
        })()`,
      });
      const info = result.value;
      if (info.scrollWidth > info.clientWidth) {
        problems++;
        console.log(
          `  ✖ ${path} (${view.name}): rolagem horizontal (${info.scrollWidth}px > ${info.clientWidth}px): ${info.wide.join(", ")}`,
        );
      }

      const shot = await page.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: view.width, height: Math.min(info.height, 6000), scale: 1 },
      });
      const file = join(OUT, `${slug}-${view.name}.png`);
      await writeFile(file, Buffer.from(shot.data, "base64"));
      console.log(`  ${file}`);
    }
  }
  ws.close();
} finally {
  chrome.kill();
  await wait(300);
  await rm(PROFILE, { recursive: true, force: true });
}
if (problems > 0) process.exitCode = 1;
