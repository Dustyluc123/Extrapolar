// Esquemas Zod dos JSON gerados em data/generated (saída do pipeline, entrada do site).
// O pipeline valida antes de gravar; o site valida de novo no build.
import { z } from "zod";
import { LOCAL_DATE, LOCAL_DATE_TIME } from "./camara";

const localDateTime = z.string().regex(LOCAL_DATE_TIME, "esperado AAAA-MM-DDTHH:mm:ss");
const localDate = z.string().regex(LOCAL_DATE, "esperado AAAA-MM-DD");

export const GENERATED_SCHEMA_VERSION = 1;

// ---- meta.json ----

export const sourceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.url(),
  /** Cabeçalho Last-Modified do arquivo oficial, quando houver. */
  lastModified: z.string().nullable(),
});
export type SourceInfo = z.infer<typeof sourceInfoSchema>;

export const datasetMetaSchema = z.object({
  schemaVersion: z.literal(GENERATED_SCHEMA_VERSION),
  /** Momento da geração (ISO 8601 com fuso, UTC). */
  generatedAt: z.iso.datetime(),
  /** Data e hora de referência em horário de Brasília: até quando os dados valem. */
  referenceDateTime: localDateTime,
  legislature: z.object({ id: z.number().int(), start: localDate, end: localDate }),
  sources: z.array(sourceInfoSchema).min(1),
  /** Avisos sobre inconsistências encontradas nos dados de origem (não impedem a publicação). */
  dataQuality: z.array(
    z.object({ code: z.string(), message: z.string(), count: z.number().int() }),
  ),
});
export type DatasetMeta = z.infer<typeof datasetMetaSchema>;

// ---- deputados.json ----

export const ELECTORAL_CONDITIONS = ["Titular", "Suplente", "Suplente efetivado"] as const;

export const deputySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  party: z.string().min(1),
  state: z.string().length(2),
  photoUrl: z.url(),
  profileUrl: z.url(),
  /** Situação na data de referência. Na Fase 0 todos estão "Em exercício". */
  status: z.literal("Em exercício"),
  electoralCondition: z.enum(ELECTORAL_CONDITIONS).nullable(),
  /** Início do período em exercício atual (horário de Brasília), quando o histórico informa. */
  inServiceSince: localDateTime.nullable(),
});
export type Deputy = z.infer<typeof deputySchema>;

export const deputiesFileSchema = z.object({
  schemaVersion: z.literal(GENERATED_SCHEMA_VERSION),
  legislatureId: z.number().int(),
  deputies: z.array(deputySchema),
});
export type DeputiesFile = z.infer<typeof deputiesFileSchema>;

// ---- participacao.json ----

export const servicePeriodSchema = z.object({
  start: localDateTime,
  /** null = período ainda aberto na data de referência. */
  end: localDateTime.nullable(),
});
export type ServicePeriod = z.infer<typeof servicePeriodSchema>;

export const ballotBreakdownSchema = z.object({
  yes: z.number().int().nonnegative(),
  no: z.number().int().nonnegative(),
  abstention: z.number().int().nonnegative(),
  obstruction: z.number().int().nonnegative(),
  article17: z.number().int().nonnegative(),
  /** Voto registrado em votação secreta (conteúdo sigiloso). */
  secret: z.number().int().nonnegative(),
});
export type BallotBreakdown = z.infer<typeof ballotBreakdownSchema>;

export const participationSchema = z
  .object({
    deputyId: z.number().int().positive(),
    /** Votações nominais de plenário em que o deputado podia votar. */
    eligibleVotes: z.number().int().nonnegative(),
    /** Votações elegíveis em que registrou voto. */
    ballotsCast: z.number().int().nonnegative(),
    /** ballotsCast ÷ eligibleVotes; null quando não há votação elegível. */
    rate: z.number().min(0).max(1).nullable(),
    breakdown: ballotBreakdownSchema,
    /** Votos registrados em votações fora dos períodos do histórico (contados mesmo assim). */
    ballotsOutsideServicePeriods: z.number().int().nonnegative(),
    servicePeriods: z.array(servicePeriodSchema),
  })
  .refine((p) => p.ballotsCast <= p.eligibleVotes, {
    message: "ballotsCast não pode ser maior que eligibleVotes",
    path: ["ballotsCast"],
  })
  .refine(
    (p) =>
      p.breakdown.yes +
        p.breakdown.no +
        p.breakdown.abstention +
        p.breakdown.obstruction +
        p.breakdown.article17 +
        p.breakdown.secret ===
      p.ballotsCast,
    { message: "a soma dos tipos de voto deve ser igual a ballotsCast", path: ["breakdown"] },
  );
export type Participation = z.infer<typeof participationSchema>;

export const participationFileSchema = z.object({
  schemaVersion: z.literal(GENERATED_SCHEMA_VERSION),
  legislatureId: z.number().int(),
  referenceDateTime: localDateTime,
  /** Total de votações nominais de plenário na legislatura até a data de referência. */
  nominalPlenaryVotes: z.number().int().nonnegative(),
  /** Data da última votação nominal de plenário considerada. */
  lastVoteDate: localDate.nullable(),
  deputies: z.array(participationSchema),
});
export type ParticipationFile = z.infer<typeof participationFileSchema>;
