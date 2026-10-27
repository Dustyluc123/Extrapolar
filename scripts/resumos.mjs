// Apoio ao comando /resumos (.claude/commands/resumos.md): resumos em linguagem simples das
// votações dos jogos (content/resumos/). Não escreve resumos; só lista e baixa as fontes oficiais.
//
// Uso:
//   node scripts/resumos.mjs pendentes [--json]   votações dos jogos ainda sem arquivo de resumo
//   node scripts/resumos.mjs fontes <id> [<id>…]  baixa a votação, a proposição, o parecer votado e
//                                                 os textos oficiais (PDF → .txt) para
//                                                 data/raw/resumos/{id}/ e escreve FONTES.md lá
//
// Quais votações: as que os jogos usam hoje (ver scripts/lib/resumos.mjs).
import { join } from "node:path";
import { ROOT, fetchSources, gameVotesInUse, pendingVotes } from "./lib/resumos.mjs";

const [command, ...args] = process.argv.slice(2);

if (command === "pendentes") {
  const all = await gameVotesInUse();
  const pending = await pendingVotes();
  if (args.includes("--json")) {
    console.log(JSON.stringify(pending, null, 2));
  } else {
    console.log(
      `${all.length} votações usadas pelos jogos; ${all.length - pending.length} com arquivo de resumo; ${pending.length} pendentes.\n`,
    );
    for (const vote of pending) {
      console.log(
        `${vote.id}  ${vote.date}  ${vote.proposition.label}${vote.turn ? ` (${vote.turn} turno)` : ""}  [${vote.games.join(", ")}]`,
      );
    }
  }
} else if (command === "fontes" && args.length > 0) {
  const byId = new Map((await gameVotesInUse()).map((v) => [v.id, v]));
  for (const id of args) {
    const { dir, documents } = await fetchSources(id, byId.get(id));
    console.log(
      `${id}: ${join(dir, "FONTES.md").replace(ROOT, "")}  ${documents.map((d) => `${d.name}: ${d.status}`).join(" · ")}`,
    );
  }
} else {
  console.log("Uso: node scripts/resumos.mjs pendentes [--json] | fontes <idVotacao> [...]");
  process.exitCode = 1;
}
