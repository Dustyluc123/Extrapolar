// Funções do script scripts/resumos.mjs (comando /resumos), também usadas pela página de revisão
// do site em `pnpm dev` (apps/web/src/pages/dev/[pagina].astro).
//
// Quais votações: as que os jogos usam hoje (data/generated/jogos):
//   - Placar: elegíveis dos últimos 12 meses (mesma janela de packages/pipeline/.../placar.ts);
//   - Vote você também: as 10 da rodada da semana;
//   - Seja deputado: a mais recente.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const GAMES_DIR = join(ROOT, "data", "generated", "jogos");
export const SUMMARIES_DIR = join(ROOT, "content", "resumos");
export const RAW_DIR = join(ROOT, "data", "raw", "resumos");
const API = "https://dadosabertos.camara.leg.br/api/v2";
/** Igual a PLACAR_WINDOW_DAYS (packages/pipeline/src/steps/games/placar.ts). */
const PLACAR_WINDOW_DAYS = 365;

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

function addDays(day, days) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Votações usadas pelos jogos, com os jogos em que aparecem. */
export async function gameVotesInUse() {
  const [catalog, meta, round, latest] = await Promise.all([
    readJson(join(GAMES_DIR, "votacoes.json")),
    readJson(join(ROOT, "data", "generated", "meta.json")),
    readJson(join(GAMES_DIR, "vote-voce.json")),
    readJson(join(GAMES_DIR, "seja-deputado.json")),
  ]);
  const today = meta.referenceDateTime.slice(0, 10);
  const from = addDays(today, -PLACAR_WINDOW_DAYS);
  const games = new Map();
  const mark = (id, game) => games.set(id, [...(games.get(id) ?? []), game]);
  for (const vote of catalog.votes) if (vote.date >= from) mark(vote.id, "Placar");
  for (const vote of round.votes) mark(vote.id, "Vote você também");
  mark(latest.vote.id, "Seja deputado");
  return catalog.votes
    .filter((vote) => games.has(vote.id))
    .map((vote) => ({ ...vote, games: games.get(vote.id) }))
    .reverse();
}

export async function pendingVotes() {
  return (await gameVotesInUse()).filter(
    (vote) => !existsSync(join(SUMMARIES_DIR, `${vote.id}.md`)),
  );
}

// ---------- fontes oficiais ----------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET com pausa e novas tentativas (a API da Câmara às vezes devolve 500). */
async function get(url, { binary = false } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    try {
      const response = await fetch(url, {
        headers: binary ? {} : { Accept: "application/json" },
        redirect: "follow",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await sleep(300);
      return binary ? new Uint8Array(await response.arrayBuffer()) : await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Falha ao baixar ${url}: ${lastError?.message}`);
}

async function pdfToText(bytes) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.replace(/[ \t]+\n/g, "\n").trim();
}

/** Baixa um texto oficial (PDF) e guarda o PDF e o texto extraído. */
async function saveDocument(dir, name, url) {
  if (!url) return { name, url: null, status: "sem link" };
  try {
    const bytes = await get(url, { binary: true });
    if (!bytes) return { name, url, status: "não encontrado (404)" };
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50; // "%P"
    if (!isPdf) return { name, url, status: "não é PDF (abrir o link)" };
    await writeFile(join(dir, `${name}.pdf`), bytes);
    const text = await pdfToText(bytes);
    await writeFile(join(dir, `${name}.txt`), text);
    return {
      name,
      url,
      status: text.length > 200 ? `ok (${text.length} caracteres)` : "PDF sem texto (imagem?)",
    };
  } catch (error) {
    return { name, url, status: `erro: ${error.message}` };
  }
}

export async function fetchSources(voteId, catalogVote) {
  const dir = join(RAW_DIR, voteId);
  await mkdir(dir, { recursive: true });
  const vote = (await get(`${API}/votacoes/${voteId}`))?.dados;
  if (!vote) throw new Error(`Votação ${voteId} não encontrada na API.`);
  const propositionId = catalogVote?.proposition.id ?? Number(voteId.split("-")[0]);
  const proposition = (await get(`${API}/proposicoes/${propositionId}`))?.dados;
  const authors = (await get(`${API}/proposicoes/${propositionId}/autores`))?.dados ?? [];
  const citedUri = vote.ultimaApresentacaoProposicao?.uriProposicaoCitada ?? null;
  const cited =
    citedUri && !citedUri.endsWith(`/${propositionId}`) ? (await get(citedUri))?.dados : null;
  // Redação final (o texto como a Câmara aprovou nesta votação): a primeira do dia da votação ou
  // depois (pode haver outra depois, quando o projeto volta do Senado). Sem ela, o substitutivo ou
  // parecer mais recente, se for do dia da votação ou depois (um anterior pode estar desatualizado).
  const related = (await get(`${API}/proposicoes/${propositionId}/relacionadas`))?.dados ?? [];
  const ofType = (type) => related.filter((r) => r.siglaTipo === type).sort((a, b) => a.id - b.id);
  let final = null;
  for (const ref of ofType("RDF")) {
    const doc = (await get(ref.uri))?.dados;
    if (doc && (doc.dataApresentacao ?? "") >= vote.data) {
      final = doc;
      break;
    }
  }
  if (!final) {
    const ref = ["SBT", "SBT-A", "PRLP"].map((t) => ofType(t).at(-1)).find(Boolean);
    const doc = ref ? (await get(ref.uri))?.dados : null;
    if (doc && (doc.dataApresentacao ?? "") >= vote.data) final = doc;
  }
  await writeFile(
    join(dir, "api.json"),
    JSON.stringify({ vote, proposition, authors, cited, related, final }, null, 2),
  );

  const documents = [
    await saveDocument(dir, "texto-original", proposition?.urlInteiroTeor),
    await saveDocument(dir, "texto-votado", cited?.urlInteiroTeor),
    await saveDocument(dir, "texto-final", final?.urlInteiroTeor),
  ];

  const lines = [
    `# Fontes da votação ${voteId}`,
    "",
    `- Proposição: ${catalogVote?.proposition.label ?? `${proposition?.siglaTipo} ${proposition?.numero}/${proposition?.ano}`} (id ${propositionId}) — https://www.camara.leg.br/propostas-legislativas/${propositionId}`,
    `- Jogos: ${catalogVote?.games?.join(", ") ?? "?"}`,
    `- Data da votação: ${vote.data} · resultado oficial: ${vote.aprovacao === 1 ? "aprovada" : vote.aprovacao === 0 ? "rejeitada" : "?"}`,
    `- Descrição oficial do resultado: ${vote.descricao}`,
    `- Abertura da votação: ${vote.descUltimaAberturaVotacao ?? "—"}`,
    `- O que foi votado (catálogo): ${catalogVote?.object ?? "?"}${catalogVote?.turn ? `, ${catalogVote.turn} turno` : ""}`,
    "",
    "## Proposição",
    "",
    `- Ementa: ${proposition?.ementa ?? "—"}`,
    `- Ementa detalhada: ${proposition?.ementaDetalhada || "—"}`,
    `- Palavras-chave: ${proposition?.keywords || "—"}`,
    `- Apresentada em: ${proposition?.dataApresentacao ?? "—"}`,
    `- Autores: ${authors.map((a) => `${a.nome} (${a.tipo})`).join("; ") || "—"}`,
    `- Regime: ${proposition?.statusProposicao?.regime ?? "—"} · apreciação: ${proposition?.statusProposicao?.apreciacao ?? "—"}`,
    `- Situação hoje: ${proposition?.statusProposicao?.descricaoSituacao ?? "—"}`,
    "",
    "## Último texto apresentado antes da votação",
    "",
    vote.ultimaApresentacaoProposicao?.descricao?.replace(/\r?\n/g, " ") ?? "—",
    cited
      ? `\n- Documento citado: ${cited.siglaTipo} ${cited.numero}/${cited.ano} — ${cited.ementa}`
      : "",
    "",
    `- Texto final usado: ${final ? `${final.siglaTipo} (${final.descricaoTipo ?? ""}) de ${final.dataApresentacao ?? "?"}` : "nenhum (sem redação final nem substitutivo nas relacionadas)"}`,
    "",
    "## Textos baixados",
    "",
    ...documents.map((d) => `- ${d.name}: ${d.status}${d.url ? ` — ${d.url}` : ""}`),
    "",
  ];
  await writeFile(join(dir, "FONTES.md"), lines.join("\n"));
  return { voteId, dir, documents };
}
