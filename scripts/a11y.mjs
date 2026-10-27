// Verificação automática de acessibilidade (axe-core, regras WCAG 2.x A e AA) no site buildado,
// nos temas claro e escuro, mais um teste da busca da capa feito pelo teclado.
//
// Uso:  pnpm build && pnpm --filter @extrapolar/web preview     (site em http://localhost:4321)
//       node scripts/a11y.mjs [caminhos...]      (padrão: capa, ficha, metodologia, sobre e jogos)
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { BASE_URL, evaluate, open, wait, withChrome } from "./lib/chrome.mjs";

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

const paths = process.argv.slice(2);
if (paths.length === 0)
  paths.push(
    "/",
    "/deputados/204379",
    "/metodologia",
    "/sobre",
    "/jogos/dle",
    "/jogos/placar",
    "/jogos/vote-voce-tambem",
    "/jogos/seja-deputado",
  );

let violations = 0;
await withChrome(async (page) => {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  for (const scheme of ["light", "dark"]) {
    await page.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: scheme },
        // Sem animações: audita todos os elementos no estado final.
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    for (const path of paths) {
      await open(page, BASE_URL + path, 800);
      await evaluate(page, axeSource);
      const result = await evaluate(
        page,
        `axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
          .then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) , total: v.nodes.length })))`,
      );
      const label = `${path} (${scheme === "light" ? "claro" : "escuro"})`;
      if (result.length === 0) console.log(`  ✓ ${label}: nenhuma violação`);
      for (const v of result) {
        violations++;
        console.log(
          `  ✖ ${label}: [${v.impact}] ${v.id} — ${v.help} (${v.total}x) ex.: ${v.nodes.join(" | ")}`,
        );
      }
    }
  }

  // Busca da capa pelo teclado: Tab até o campo, digitar, conferir o contador e a URL.
  await page.send("Emulation.setEmulatedMedia", { features: [] });
  await open(page, BASE_URL + "/", 800);
  let focused = "";
  for (let i = 0; i < 20 && focused !== "q"; i++) {
    await page.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await page.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    focused = await evaluate(page, "document.activeElement?.name ?? ''");
  }
  if (focused !== "q") {
    violations++;
    console.log("  ✖ busca: o campo de busca não foi alcançado com Tab");
  } else {
    await page.send("Input.insertText", { text: "acacio" });
    await wait(200);
    const state = await evaluate(
      page,
      `({ status: document.querySelector("[data-filter-status]").textContent.trim(),
          visible: [...document.querySelectorAll("[data-deputy]")].filter((el) => !el.hidden).length,
          url: location.search })`,
    );
    const ok =
      state.visible >= 1 &&
      state.status.startsWith(`${state.visible} de`) &&
      state.url.includes("q=acacio");
    if (!ok) violations++;
    console.log(`  ${ok ? "✓" : "✖"} busca pelo teclado: "${state.status}" (url ${state.url})`);
  }
});

if (violations > 0) {
  console.log(`\n${violations} problema(s) de acessibilidade.`);
  process.exitCode = 1;
} else {
  console.log("\nAcessibilidade: nenhum problema encontrado pelas verificações automáticas.");
}
