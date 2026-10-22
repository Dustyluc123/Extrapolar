import { describe, expect, it } from "vitest";
import { unscramble } from "@extrapolar/games";
import type { Ballot } from "@extrapolar/metrics";
import { buildCatalog, buildGameDeputies, encodeBallots } from "../src/steps/games/catalog";
import { DrawState, makeRank } from "../src/steps/games/draw";
import { parseSummaryFile } from "../src/steps/games/summaries";
import type { GameVotesSources } from "../src/steps/fetch";

describe("resumos em linguagem simples", () => {
  it("lê o cabeçalho e o texto", () => {
    const s = parseSummaryFile(
      "1-2",
      "---\nrevisado: true\nautor: Lucas\ndata: 2026-10-30\n---\n\nTexto simples.\n",
    );
    expect(s).toEqual({ voteId: "1-2", reviewed: true, text: "Texto simples." });
  });

  it("rascunho é lido, mas marcado como não revisado", () => {
    expect(parseSummaryFile("1-2", "---\nrevisado: false\n---\nRascunho").reviewed).toBe(false);
  });

  it("cabeçalho ausente ou inválido para com mensagem clara", () => {
    expect(() => parseSummaryFile("1-2", "Sem cabeçalho")).toThrow(/1-2\.md/);
    expect(() => parseSummaryFile("1-2", "---\nrevisado: talvez\n---\nTexto")).toThrow(/revisado/);
    expect(() => parseSummaryFile("1-2", "---\nrevisado: true\n---\n")).toThrow(/sem texto/);
  });
});

const sources: GameVotesSources = {
  info: new Map([
    [
      "10-1",
      {
        id: "10-1",
        date: "2026-03-01",
        dateTime: "2026-03-01T15:00:00",
        description: "Aprovado o Projeto de Lei nº 10, de 2026. Sim: 2; Não: 1; Total: 3.",
        approval: 1,
        secret: false,
        official: { yes: 2, no: 1, others: 0 },
      },
    ],
    [
      "10-2",
      {
        id: "10-2",
        date: "2026-03-01",
        dateTime: "2026-03-01T14:00:00",
        description: "Rejeitado o Requerimento. Sim: 1; Não: 2; Total: 3.",
        approval: 0,
        secret: false,
        official: { yes: 1, no: 2, others: 0 },
      },
    ],
  ]),
  linked: new Map([
    ["10-1", [{ id: 10, type: "PL", number: 10, year: 2026, summary: "Cria a regra." }]],
  ]),
  lookup: new Map(),
};

const ballots: Ballot[] = [
  { voteId: "10-1", deputyId: 3, value: "yes", party: "PT" },
  { voteId: "10-1", deputyId: 1, value: "no", party: "PL" },
  { voteId: "10-1", deputyId: 2, value: "article17", party: "PSD" },
  { voteId: "10-2", deputyId: 1, value: "yes", party: "PL" },
];

describe("catálogo de votações elegíveis", () => {
  it("separa elegíveis e conta as que ficaram fora por motivo", () => {
    const catalog = buildCatalog({
      sources,
      ballots,
      summaries: new Map(),
      onUnusedSummary: () => {},
    });
    expect(catalog.file.votes.map((v) => v.id)).toEqual(["10-1"]);
    expect(catalog.file.excluded.procedimento).toBe(1);
    expect(catalog.file.votes[0]).toMatchObject({
      proposition: { id: 10, label: "PL 10/2026", summary: "Cria a regra." },
      approved: true,
      plainSummary: null,
      counts: { yes: 1, no: 1, abstention: 0, obstruction: 0, article17: 1 },
    });
  });

  it("usa o resumo só se revisado e avisa sobre resumo sem votação", () => {
    const unused: string[] = [];
    const catalog = buildCatalog({
      sources,
      ballots,
      summaries: new Map([
        ["10-1", { voteId: "10-1", reviewed: true, text: "Resumo." }],
        ["99-9", { voteId: "99-9", reviewed: true, text: "Outro." }],
      ]),
      onUnusedSummary: (id) => unused.push(id),
    });
    expect(catalog.file.votes[0]!.plainSummary).toBe("Resumo.");
    expect(unused).toEqual(["99-9"]);
  });

  it("votos compactos na ordem dos deputados (por id)", () => {
    const catalog = buildCatalog({
      sources,
      ballots,
      summaries: new Map(),
      onUnusedSummary: () => {},
    });
    const order = buildGameDeputies([
      { id: 3, name: "C", party: "PT", state: "SP" },
      { id: 1, name: "A", party: "PL", state: "RJ" },
      { id: 2, name: "B", party: "PSD", state: "MG" },
      { id: 4, name: "D", party: "PT", state: "SP" },
    ] as never).deputies;
    expect(order.map((d) => d.id)).toEqual([1, 2, 3, 4]);
    expect(encodeBallots(order, catalog.ballotsByVote.get("10-1"))).toBe("NPS-");
  });
});

describe("estado do sorteio", () => {
  it("primeira execução: lançamento hoje, 4 dias publicados e embaralhados com a data", () => {
    const state = new DrawState(null, "2026-10-23");
    const days = state.draw({
      key: "placar",
      ids: ["a", "b", "c"],
      today: "2026-10-23",
      rank: makeRank("segredo-de-teste-123", "placar"),
      payload: (id) => ({ id }),
    });
    expect(days.map((d) => [d.date, d.number])).toEqual([
      ["2026-10-23", 1],
      ["2026-10-24", 2],
      ["2026-10-25", 3],
      ["2026-10-26", 4],
    ]);
    const first = JSON.parse(unscramble(days[0]!.data, "2026-10-23"));
    expect(["a", "b", "c"]).toContain(first.id);
    expect(state.toFile().rosters.placar!.every((e) => e.since === "2026-10-23")).toBe(true);
  });

  it("execução seguinte: os mesmos dias, mesmo com item novo", () => {
    const rank = makeRank("segredo-de-teste-123", "placar");
    const first = new DrawState(null, "2026-10-23");
    const day1 = first.draw({
      key: "placar",
      ids: ["a", "b", "c"],
      today: "2026-10-23",
      rank,
      payload: (id) => id,
    });
    const second = new DrawState(first.toFile(), "2026-10-24");
    const day2 = second.draw({
      key: "placar",
      ids: ["a", "b", "c", "d"],
      today: "2026-10-24",
      rank,
      payload: (id) => id,
    });
    expect(day2[0]).toEqual(day1[1]);
    expect(second.toFile().rosters.placar!.find((e) => e.id === "d")!.since).toBe("2026-10-24");
    expect(second.toFile().launchDate).toBe("2026-10-23");
  });

  it("chaves diferentes dão ordens diferentes", () => {
    const a = makeRank("chave-um-0000000000", "placar")(0, "x");
    const b = makeRank("chave-dois-00000000", "placar")(0, "x");
    expect(a).not.toBe(b);
  });
});
