// Esquemas Zod do formato que a Câmara publica (entrada do pipeline).
// Mantêm os nomes de campo originais. Campos extras são ignorados; campos
// esperados que faltarem ou mudarem de tipo fazem o pipeline falhar.
// Formatos conferidos em docs/FONTES.md.
import { z } from "zod";

/** Data e hora local da Câmara com segundos: 2023-03-14T19:20:56 */
export const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
/** Data e hora local sem segundos (usada no histórico): 2023-02-01T12:05 */
export const LOCAL_DATE_TIME_MINUTES = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
export const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

const linkSchema = z.object({ rel: z.string(), href: z.string() });

/** Página de resposta da API: { dados: [...], links: [...] }. */
export function apiPageSchema<T extends z.ZodType>(item: T) {
  return z.object({ dados: z.array(item), links: z.array(linkSchema) });
}

// ---- API: /deputados ----

export const camaraDeputyListItemSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1),
  siglaPartido: z.string().min(1),
  siglaUf: z.string().length(2),
  idLegislatura: z.number().int(),
  urlFoto: z.url(),
  email: z.string().nullable(),
});
export type CamaraDeputyListItem = z.infer<typeof camaraDeputyListItemSchema>;
export const camaraDeputyListPageSchema = apiPageSchema(camaraDeputyListItemSchema);

// ---- API: /deputados/{id}/historico ----

export const camaraHistoryEventSchema = z.object({
  id: z.number().int().positive(),
  idLegislatura: z.number().int(),
  dataHora: z.string().regex(LOCAL_DATE_TIME_MINUTES, "esperado AAAA-MM-DDTHH:mm"),
  situacao: z.string().nullable(),
  condicaoEleitoral: z.string().nullable(),
  descricaoStatus: z.string().nullable(),
  siglaPartido: z.string().nullable(),
  siglaUf: z.string().nullable(),
});
export type CamaraHistoryEvent = z.infer<typeof camaraHistoryEventSchema>;
export const camaraHistoryResponseSchema = z.object({
  dados: z.array(camaraHistoryEventSchema),
});

// ---- Arquivo: votacoes-{ano}.json ----

export const camaraVoteSchema = z.object({
  id: z.string().min(1),
  data: z.string().regex(LOCAL_DATE, "esperado AAAA-MM-DD"),
  // Vem vazio em algumas votações (vistas só em comissões).
  dataHoraRegistro: z.union([z.literal(""), z.string().regex(LOCAL_DATE_TIME)]),
  idOrgao: z.number().int(),
  siglaOrgao: z.string().min(1),
  votosSim: z.number().int().nonnegative(),
  votosNao: z.number().int().nonnegative(),
  votosOutros: z.number().int().nonnegative(),
  descricao: z.string(),
});
export type CamaraVote = z.infer<typeof camaraVoteSchema>;
export const camaraVotesFileSchema = z.object({ dados: z.array(camaraVoteSchema) });

// ---- Arquivo: votacoesVotos-{ano}.json ----

/** Valores de voto encontrados nos arquivos. Um valor novo faz o pipeline falhar (de propósito). */
export const CAMARA_BALLOT_VALUES = ["Sim", "Não", "Abstenção", "Obstrução", "Artigo 17"] as const;

export const camaraBallotSchema = z.object({
  idVotacao: z.string().min(1),
  dataHoraVoto: z.string().regex(LOCAL_DATE_TIME),
  voto: z.enum(CAMARA_BALLOT_VALUES),
  deputado_: z.object({
    // No arquivo, id e legislatura vêm como texto.
    id: z.string().regex(/^\d+$/, "esperado número em texto"),
    nome: z.string(),
    siglaPartido: z.string().nullable(),
    siglaUf: z.string().nullable(),
    idLegislatura: z.string().regex(/^\d+$/),
  }),
});
export type CamaraBallot = z.infer<typeof camaraBallotSchema>;
export const camaraBallotsFileSchema = z.object({ dados: z.array(camaraBallotSchema) });
