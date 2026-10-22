// Capturas de tela do site com o Chrome headless e emulação de celular (protocolo DevTools).
// Também confere se a página tem rolagem horizontal (erro de layout no celular).
//
// Uso:  pnpm build && pnpm --filter @extrapolar/web preview     (site em http://localhost:4321)
//       node scripts/screenshots.mjs / /deputados/204379
// Saída: docs/screenshots/<página>-<celular|desktop>-<claro|escuro>.png (fora do Git)
// SCREENSHOT_MAX_HEIGHT=900 limita a altura da captura (a partir do topo), em pixels CSS.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BASE_URL, ROOT, evaluate, open, withChrome } from "./lib/chrome.mjs";

const OUT = join(ROOT, "docs", "screenshots");
const MAX_HEIGHT = Number(process.env.SCREENSHOT_MAX_HEIGHT ?? 6000);
const VIEWS = [
  { name: "celular-claro", width: 390, height: 844, mobile: true, scheme: "light" },
  { name: "celular-escuro", width: 390, height: 844, mobile: true, scheme: "dark" },
  { name: "desktop-claro", width: 1280, height: 900, mobile: false, scheme: "light" },
];

const paths = process.argv.slice(2);
if (paths.length === 0) paths.push("/");
await mkdir(OUT, { recursive: true });

let problems = 0;
await withChrome(async (page) => {
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
      await open(page, BASE_URL + path);
      const info = await evaluate(
        page,
        `(() => {
          const doc = document.documentElement;
          const wide = [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
            .slice(0, 5)
            .map((el) => el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ").slice(0, 3).join(".") : ""));
          return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, height: doc.scrollHeight, wide };
        })()`,
      );
      if (info.scrollWidth > info.clientWidth) {
        problems++;
        console.log(
          `  ✖ ${path} (${view.name}): rolagem horizontal (${info.scrollWidth}px > ${info.clientWidth}px): ${info.wide.join(", ")}`,
        );
      }
      const shot = await page.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: view.width,
          height: Math.min(info.height, MAX_HEIGHT),
          scale: 1,
        },
      });
      const file = join(OUT, `${slug}-${view.name}.png`);
      await writeFile(file, Buffer.from(shot.data, "base64"));
      console.log(`  ${file}`);
    }
  }
});
if (problems > 0) process.exitCode = 1;
