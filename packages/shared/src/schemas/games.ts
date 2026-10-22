// Esquemas dos JSON dos jogos (data/generated/jogos/), Fase 2. ADRs 0019 a 0021.
import { z } from "zod";
import { LOCAL_DATE } from "./camara";

const localDate = z.string().regex(LOCAL_DATE, "esperado AAAA-MM-DD");

export const GAMES_SCHEMA_VERSION = 1;

/**
 * Voto de cada deputado em formato compacto: um caractere por deputado, na ordem de
 * `jogos/deputados.json`. S = Sim, N = Não, A = Abstenção, O = Obstrução, P = Art. 17 (quem
 * preside), "-" = sem voto registrado (inclusive quem não estava em exercício).
 */
export const BALLOT_STRING = /^[SNAOP-]*$/;
export const ballotStringSchema = z.string().regex(BALLOT_STRING, "esperado só S, N, A, O, P ou -");

export const voteCountsSchema = z.object({
  yes: z.number().int().nonnegative(),
  no: z.number().int().nonnegative(),
  abstention: z.number().int().nonnegative(),
  obstruction: z.number().int().nonnegative(),
  article17: z.number().int().nonnegative(),
});
export type VoteCounts = z.infer<typeof voteCountsSchema>;

/** Uma votação elegível (nominal de plenário, de mérito, com proposição identificada). */
export const gameVoteSchema = z.object({
  id: z.string().min(1),
  date: localDate,
  proposition: z.object({
    id: z.number().int().positive(),
    /** "PL 6.139/2023" */
    label: z.string().min(1),
    /** Ementa oficial. */
    summary: z.string().min(1),
  }),
  /** Resumo em linguagem simples, só quando existe e foi revisado (content/resumos). */
  plainSummary: z.string().nullable(),
  /** O que foi votado, como na descrição oficial ("Substitutivo", "Projeto de Lei"…). */
  object: z.string().min(1),
  turn: z.enum(["primeiro", "segundo"]).nullable(),
  approved: z.boolean(),
  /** Placar oficial do arquivo de votações (todos os deputados que votaram). */
  official: z.object({
    yes: z.number().int().nonnegative(),
    no: z.number().int().nonnegative(),
    others: z.number().int().nonnegative(),
  }),
  /** Contagem por tipo de voto, a partir dos votos individuais (todos os deputados). */
  counts: voteCountsSchema,
});
export type GameVote = z.infer<typeof gameVoteSchema>;

export const ELIGIBILITY_EXCLUSION_REASONS = [
  "secreta",
  "procedimento",
  "sem-proposicao",
  "tipo-fora",
  "sem-resultado",
  "resultado-divergente",
] as const;

export const gameVotesFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  /** Votações nominais de plenário da legislatura até a data de referência. */
  nominalVotes: z.number().int().nonnegative(),
  /** Quantas ficaram fora, por motivo. */
  excluded: z.record(z.enum(ELIGIBILITY_EXCLUSION_REASONS), z.number().int().nonnegative()),
  /** Elegíveis, da mais antiga para a mais recente. */
  votes: z.array(gameVoteSchema),
});
export type GameVotesFile = z.infer<typeof gameVotesFileSchema>;

/** Deputados em exercício na ordem usada pelos votos compactos. */
export const gameDeputiesFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  deputies: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string().min(1),
      party: z.string().min(1),
      state: z.string().length(2),
    }),
  ),
});
export type GameDeputiesFile = z.infer<typeof gameDeputiesFileSchema>;

/**
 * Estado do sorteio diário (ADR 0020). Só cresce: itens que saem continuam, para os dias já
 * sorteados nunca mudarem.
 */
export const drawStateFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  /** Dia do desafio #1. */
  launchDate: localDate,
  rosters: z.record(z.string(), z.array(z.object({ id: z.string().min(1), since: localDate }))),
});
export type DrawStateFile = z.infer<typeof drawStateFileSchema>;

/** Um dia sorteado: data e conteúdo embaralhado com a data (não é segredo; ADR 0020). */
export const drawnDaySchema = z.object({
  date: localDate,
  number: z.number().int().positive(),
  data: z.string(),
});
export type DrawnDay = z.infer<typeof drawnDaySchema>;

// ---- Jogo 1: Dle do seu estado (jogos/dle/{UF}.json) ----

/**
 * Atributos factuais usados no Dle (nenhum soa como julgamento): partido, condição eleitoral,
 * ano da estreia na Câmara, ano e estado de nascimento, comissões em que é titular hoje e
 * projetos apresentados como autor principal na legislatura.
 */
export const dleDeputySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  party: z.string().min(1),
  condition: z.string().nullable(),
  /** Ano de início da primeira legislatura na Câmara. */
  since: z.number().int().nullable(),
  birthYear: z.number().int().nullable(),
  birthState: z.string().nullable(),
  /** Siglas das comissões em que é titular hoje. */
  committees: z.array(z.string()),
  projects: z.number().int().nonnegative().nullable(),
});
export type DleDeputy = z.infer<typeof dleDeputySchema>;

export const dleStateFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  state: z.string().length(2),
  /** Partido → federação (partidos da mesma federação contam como "perto"). */
  federations: z.record(z.string(), z.string()),
  deputies: z.array(dleDeputySchema).min(1),
  /** Dias sorteados: o conteúdo embaralhado é o id do deputado do dia. */
  days: z.array(drawnDaySchema),
});
export type DleStateFile = z.infer<typeof dleStateFileSchema>;

// ---- Jogo 2: Placar (jogos/placar.json) ----

/** Conteúdo de um dia do Placar (vai embaralhado em `days[].data`). */
export const placarDaySchema = z.object({
  vote: gameVoteSchema,
  /** Votos compactos dos deputados em exercício (ordem de jogos/deputados.json). */
  ballots: ballotStringSchema,
});
export type PlacarDay = z.infer<typeof placarDaySchema>;

export const placarFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  /** Quantas votações estão no sorteio (elegíveis dos últimos 12 meses). */
  poolSize: z.number().int().nonnegative(),
  days: z.array(drawnDaySchema),
});
export type PlacarFile = z.infer<typeof placarFileSchema>;

// ---- Jogos 3 e 4: votações com o voto de cada deputado e a orientação de cada partido ----

/**
 * Orientação de um partido numa votação, um caractere: S = Sim, N = Não, A = Abstenção,
 * O = Obstrução, L = liberou a bancada, B = só o bloco orientou (não usada — ADR 0014),
 * "-" = sem orientação. Partido → federação quando o partido não orientou sozinho.
 */
export const ORIENTATION_STRING = /^[SNAOLB-]*$/;

export const partyOrientationSchema = z.object({
  party: z.string().min(1),
  /** Um caractere por votação, na ordem de `votes`. */
  orientations: z.string().regex(ORIENTATION_STRING),
  /** Votações em que valeu a orientação da federação (mesma ordem; "1" = sim). */
  viaFederation: z.string().regex(/^[01]*$/),
});
export type PartyOrientation = z.infer<typeof partyOrientationSchema>;

/** Jogo 3 — Vote você também: a rodada da semana (jogos/vote-voce.json). */
export const voteRoundFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  /** Segunda-feira da semana da rodada. */
  week: localDate,
  votes: z.array(gameVoteSchema).max(10),
  /** Votos compactos de cada votação (ordem de jogos/deputados.json). */
  ballots: z.array(ballotStringSchema),
  parties: z.array(partyOrientationSchema),
});
export type VoteRoundFile = z.infer<typeof voteRoundFileSchema>;

/** Jogo 4 — Seja deputado: a votação elegível mais recente (jogos/seja-deputado.json). */
export const latestVoteFileSchema = z.object({
  schemaVersion: z.literal(GAMES_SCHEMA_VERSION),
  vote: gameVoteSchema,
  ballots: ballotStringSchema,
  /** Partido de cada deputado na data da votação (mesma ordem; "" = sem voto registrado). */
  partiesAtVote: z.array(z.string()),
  parties: z.array(partyOrientationSchema),
});
export type LatestVoteFile = z.infer<typeof latestVoteFileSchema>;
