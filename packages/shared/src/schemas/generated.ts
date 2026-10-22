// Esquemas Zod dos JSON gerados em data/generated (saída do pipeline, entrada do site).
// O pipeline valida antes de gravar; o site valida de novo no build.
import { z } from "zod";
import { NO_DATA_REASON_CODES } from "../no-data";
import { LOCAL_DATE, LOCAL_DATE_TIME } from "./camara";

const localDateTime = z.string().regex(LOCAL_DATE_TIME, "esperado AAAA-MM-DDTHH:mm:ss");
const localDate = z.string().regex(LOCAL_DATE, "esperado AAAA-MM-DD");

export const GENERATED_SCHEMA_VERSION = 2;

export const localDateTimeSchema = localDateTime;
export const localDateSchema = localDate;

// ---- valor de métrica (padrão para todas) ----

/**
 * Valor de uma métrica para um deputado: calculado (com numerador e denominador quando for razão)
 * ou "sem dado" com motivo padronizado (ver no-data.ts). Nunca zero no lugar de sem dado.
 */
export const metricValueSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    value: z.number(),
    numerator: z.number().nullable(),
    denominator: z.number().nullable(),
  }),
  z.object({ status: z.literal("sem-dado"), reason: z.enum(NO_DATA_REASON_CODES) }),
]);
export type MetricValue = z.infer<typeof metricValueSchema>;

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
  /** Totais da legislatura usados na capa e nos textos de contexto. */
  totals: z.object({
    /** Votações nominais de plenário na legislatura até a data de referência. */
    nominalPlenaryVotes: z.number().int().nonnegative(),
    /** Data da última votação nominal de plenário considerada. */
    lastNominalVoteDate: localDate.nullable(),
  }),
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

// ---- presença e alinhamento (Caderno 1 — Plenário) ----

const count = z.number().int().nonnegative();

export const attendanceSchema = z
  .object({
    eligibleEvents: count,
    attendedEvents: count,
    rate: z.number().min(0).max(1).nullable(),
    attendedOutsideServicePeriods: count,
  })
  .refine((a) => a.attendedEvents <= a.eligibleEvents, {
    message: "attendedEvents não pode ser maior que eligibleEvents",
    path: ["attendedEvents"],
  });
export type Attendance = z.infer<typeof attendanceSchema>;

export const alignmentSchema = z
  .object({
    comparableVotes: count,
    alignedVotes: count,
    rate: z.number().min(0).max(1).nullable(),
    excluded: z.object({
      free: count,
      noOrientation: count,
      blocOnly: count,
      ballotNotComparable: count,
    }),
    /** Das votações comparáveis, quantas usaram a orientação da federação (e não do partido). */
    federationVotes: count,
  })
  .refine((a) => a.alignedVotes <= a.comparableVotes, {
    message: "alignedVotes não pode ser maior que comparableVotes",
    path: ["alignedVotes"],
  });
export type Alignment = z.infer<typeof alignmentSchema>;

// ---- Caderno 2 — Comissões ----

export const organMembershipSchema = z.object({
  organId: z.number().int(),
  sigla: z.string(),
  nome: z.string(),
  /** Tipo oficial do órgão (Comissão Permanente, Comissão Especial, CPI...). */
  tipo: z.string(),
  cargo: z.string(),
  inicio: localDate,
  /** null = ainda em andamento na data de referência. */
  fim: localDate.nullable(),
});
export type OrganMembership = z.infer<typeof organMembershipSchema>;

export const requestedEventSchema = z.object({
  data: localDate,
  tipo: z.string(),
  orgaos: z.array(z.string()),
  descricao: z.string(),
});

export const comissoesSchema = z.object({
  /** Todos os cargos em órgãos da Câmara na legislatura (comissões, conselhos, Mesa...). */
  participacoes: z.array(organMembershipSchema),
  /** Comissões (permanentes, especiais, CPIs) em que é titular, presidente ou vice hoje. */
  titularHoje: count,
  /** Foi titular (ou presidente/vice) de alguma comissão na legislatura. */
  foiTitular: z.boolean(),
  presencaReunioes: attendanceSchema,
  eventosRequeridos: z.object({
    total: count,
    comoPrimeiroSignatario: count,
    porTipo: z.array(z.object({ tipo: z.string(), quantidade: count })),
    /** Até 5 eventos mais recentes, para dar exemplos na ficha. */
    recentes: z.array(requestedEventSchema).max(5),
  }),
});
export type Comissoes = z.infer<typeof comissoesSchema>;

// ---- deputados/{id}.json (detalhe por deputado, organizado por caderno) ----
// Não leva a data da edição: o arquivo só muda quando os dados do deputado mudam (ADR 0012).

export const deputyDetailSchema = z.object({
  schemaVersion: z.literal(GENERATED_SCHEMA_VERSION),
  deputyId: z.number().int().positive(),
  plenario: z.object({
    participacao: participationSchema,
    presencaSessoes: attendanceSchema,
    alinhamentoPartido: alignmentSchema,
    alinhamentoGoverno: alignmentSchema,
  }),
  comissoes: comissoesSchema,
});
export type DeputyDetail = z.infer<typeof deputyDetailSchema>;

// ---- metricas.json (valores brutos para a futura ordenação da Fase 2; sem ranking) ----

export const METRIC_UNITS = ["proporcao", "contagem", "reais"] as const;

export const metricIndexEntrySchema = z.object({
  key: z.string(),
  caderno: z.string(),
  label: z.string(),
  unit: z.enum(METRIC_UNITS),
  /** Âncora da seção na metodologia. */
  methodologyAnchor: z.string(),
  /** Valor por id do deputado. */
  values: z.record(z.string().regex(/^\d+$/), metricValueSchema),
});
export type MetricIndexEntry = z.infer<typeof metricIndexEntrySchema>;

export const metricsIndexSchema = z.object({
  schemaVersion: z.literal(GENERATED_SCHEMA_VERSION),
  legislatureId: z.number().int(),
  metrics: z.array(metricIndexEntrySchema),
});
export type MetricsIndex = z.infer<typeof metricsIndexSchema>;
