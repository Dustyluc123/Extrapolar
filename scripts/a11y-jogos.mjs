// Acessibilidade dos jogos e do ranking **depois de jogar**: preenche o estado salvo no navegador
// (como se o jogador tivesse terminado) e roda o axe-core na revelação e nos resultados, nos temas
// claro e escuro. Complementa `pnpm check:a11y`, que audita as páginas no estado inicial.
//
// Uso:  pnpm build && pnpm --filter @extrapolar/web preview     (site em http://localhost:4321)
//       node scripts/a11y-jogos.mjs        (ou BASE_URL=http://localhost:4322 se a porta mudar)
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { BASE_URL, evaluate, open, withChrome } from "./lib/chrome.mjs";

const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

// Depois de carregar: jogos 3 e 4 são jogados pela interface (cliques), até o resultado.
const PLAY = {
  "/jogos/vote-voce-tambem": `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const button = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(text));
    const stamps = () => [...document.querySelectorAll("button.rubber-stamp")];
    // Carimba, separa alguns para depois e, no fim, deixa os separados em branco.
    for (let i = 0; i < 10; i++) { (i % 3 === 0 ? button("Separar para depois") : stamps()[i % 2])?.click(); await wait(60); }
    for (let i = 0; i < 10 && stamps().length > 0; i++) { button("Deixar em branco")?.click(); await wait(60); }
    button("Ver o relatório final")?.click();
    await wait(200);
    return true;
  })()`,
  // No meio da rodada: alguns carimbados e outros na bandeja "Para depois".
  "/jogos/vote-voce-tambem?bandeja": `(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const button = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().includes(text));
    for (let i = 0; i < 10; i++) { (i % 3 === 0 ? button("Separar para depois") : document.querySelectorAll("button.rubber-stamp")[i % 2])?.click(); await wait(60); }
    return true;
  })()`,
  "/jogos/seja-deputado": `(async () => {
    document.querySelector("button.rubber-stamp")?.click();
    await new Promise((r) => setTimeout(r, 200));
    return true;
  })()`,
};

// Monta, no próprio navegador, o estado "jogo terminado" de cada jogo a partir dos dados do site.
const SETUP = {
  "/jogos/dle": `(async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const f = await (await fetch("/jogos/dados/dle-AP.json")).json();
    localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("AP"));
    localStorage.setItem("extrapolar:jogos:dle:AP:" + today, JSON.stringify({ guesses: f.deputies.map((d) => d.id), hint: true }));
  })()`,
  // No meio do jogo: pasta secreta com o campo de chute e duas fichas puxadas.
  "/jogos/dle?em-andamento": `(async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const f = await (await fetch("/jogos/dados/dle-SP.json")).json();
    localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("SP"));
    localStorage.setItem("extrapolar:jogos:dle:SP:" + today, JSON.stringify({ guesses: f.deputies.slice(0, 2).map((d) => d.id), hint: false }));
  })()`,
  // Boletim do Placar aberto, ainda sem entregar.
  "/jogos/placar?boletim": `(() => { localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("SP")); return true; })()`,
  "/jogos/placar": `(async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("SP"));
    localStorage.setItem("extrapolar:jogos:placar:" + today, JSON.stringify({ state: "SP", majority: "yes", guess: 60 }));
  })()`,
  "/jogos/vote-voce-tambem": `(() => { localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("RJ")); return true; })()`,
  "/jogos/vote-voce-tambem?bandeja": "true",
  "/jogos/seja-deputado": `(() => { localStorage.setItem("extrapolar:jogos:estado", JSON.stringify("AP")); return true; })()`,
  "/ranking?m=participacao.3.mais,cota-total.2.menos,alinhamento-partido.1.mais&uf=SP": "true",
};

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
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    for (const [path, setup] of Object.entries(SETUP)) {
      await open(page, BASE_URL + path, 800);
      await evaluate(page, "localStorage.clear(); true");
      await evaluate(page, setup);
      await open(page, BASE_URL + path, 1500);
      if (PLAY[path]) await evaluate(page, PLAY[path]);
      // Abre os detalhes recolhidos para auditar o conteúdo deles também.
      await evaluate(
        page,
        `document.querySelectorAll("details").forEach((d) => (d.open = true)); true`,
      );
      await evaluate(page, axeSource);
      const result = await evaluate(
        page,
        `axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
          .then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")), total: v.nodes.length })))`,
      );
      const moment =
        path.includes("?") && !path.startsWith("/ranking")
          ? `(${path.split("?")[1]})`
          : "depois de jogar";
      const label = `${path.split("?")[0]} ${moment} (${scheme === "light" ? "claro" : "escuro"})`;
      if (result.length === 0) console.log(`  ✓ ${label}: nenhuma violação`);
      for (const v of result) {
        violations++;
        console.log(
          `  ✖ ${label}: [${v.impact}] ${v.id} — ${v.help} (${v.total}x) ex.: ${v.nodes.join(" | ")}`,
        );
      }
    }
  }
});

console.log(
  violations === 0
    ? "\nAcessibilidade dos jogos: nenhum problema encontrado."
    : `\n${violations} problema(s) de acessibilidade nos jogos.`,
);
process.exit(violations === 0 ? 0 : 1);
