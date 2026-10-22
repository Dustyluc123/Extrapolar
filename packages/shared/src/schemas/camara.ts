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
  /** Usado para reconhecer votação secreta ("Votação secreta em turno único."). */
  ultimaAberturaVotacao: z.object({ descricao: z.string() }).optional(),
});
export type CamaraVote = z.infer<typeof camaraVoteSchema>;
export const camaraVotesFileSchema = z.object({ dados: z.array(camaraVoteSchema) });

// ---- Arquivo: votacoesVotos-{ano}.json ----

/**
 * Valores de voto encontrados nos arquivos. Um valor novo faz o pipeline falhar (de propósito).
 * "" aparece em votações secretas: o voto foi registrado, mas o conteúdo é sigiloso (ADR 0008).
 */
export const CAMARA_BALLOT_VALUES = [
  "Sim",
  "Não",
  "Abstenção",
  "Obstrução",
  "Artigo 17",
  "",
] as const;

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

// ---- Arquivos: eventos-{ano}, eventosOrgaos-{ano}, eventosPresencaDeputados-{ano} ----

export const camaraEventSchema = z.object({
  id: z.number().int().positive(),
  dataHoraInicio: z.string().regex(LOCAL_DATE_TIME),
  situacao: z.string(),
  descricaoTipo: z.string(),
  descricao: z.string(),
});
export type CamaraEvent = z.infer<typeof camaraEventSchema>;
export const camaraEventsFileSchema = z.object({ dados: z.array(camaraEventSchema) });

export const camaraEventOrganSchema = z.object({
  idEvento: z.number().int().positive(),
  idOrgao: z.number().int(),
  siglaOrgao: z.string(),
});
export type CamaraEventOrgan = z.infer<typeof camaraEventOrganSchema>;
export const camaraEventOrgansFileSchema = z.object({ dados: z.array(camaraEventOrganSchema) });

export const camaraEventPresenceSchema = z.object({
  idEvento: z.number().int().positive(),
  idDeputado: z.number().int().positive(),
});
export type CamaraEventPresence = z.infer<typeof camaraEventPresenceSchema>;
export const camaraEventPresencesFileSchema = z.object({
  dados: z.array(camaraEventPresenceSchema),
});

// ---- Arquivo: votacoesOrientacoes-{ano} ----

/** Valores de orientação encontrados (2023–2026). Um valor novo faz o pipeline falhar. */
export const CAMARA_ORIENTATION_VALUES = [
  "Sim",
  "Não",
  "Obstrução",
  "Abstenção",
  "Liberado",
  "",
] as const;

export const camaraOrientationSchema = z.object({
  idVotacao: z.string().min(1),
  siglaOrgao: z.string(),
  siglaBancada: z.string(),
  orientacao: z.enum(CAMARA_ORIENTATION_VALUES),
});
export type CamaraOrientation = z.infer<typeof camaraOrientationSchema>;
export const camaraOrientationsFileSchema = z.object({ dados: z.array(camaraOrientationSchema) });

// ---- API: /blocos e /blocos/{id}/partidos (usados só para federações) ----

export const camaraBlocSchema = z.object({
  id: z.string().regex(/^\d+$/),
  nome: z.string(),
  idLegislatura: z.string().regex(/^\d+$/),
  federacao: z.boolean(),
});
export const camaraBlocsPageSchema = apiPageSchema(camaraBlocSchema);
export const camaraBlocPartySchema = z.object({ sigla: z.string().min(1), nome: z.string() });
export const camaraBlocPartiesPageSchema = apiPageSchema(camaraBlocPartySchema);

// ---- Arquivos: orgaos.json e orgaosDeputados-L{legislatura}.json ----

const DATE_OR_EMPTY = z.union([z.literal(""), z.string().regex(LOCAL_DATE)]);

/** Extrai o id numérico do fim de uma URI da API (".../orgaos/2003" → 2003). */
export function idFromUri(uri: string): number {
  const match = /\/(\d+)$/.exec(uri);
  if (!match) throw new Error(`URI sem id numérico no fim: "${uri}"`);
  return Number(match[1]);
}

const apiUri = (resource: string) =>
  z.string().regex(new RegExp(`/api/v2/${resource}/\\d+$`), `esperado .../${resource}/{id}`);

export const camaraOrganSchema = z.object({
  uri: apiUri("orgaos"),
  sigla: z.string(),
  nome: z.string(),
  apelido: z.string(),
  tipoOrgao: z.string(),
  codTipoOrgao: z.number().int(),
});
export type CamaraOrgan = z.infer<typeof camaraOrganSchema>;
export const camaraOrgansFileSchema = z.object({ dados: z.array(camaraOrganSchema) });

export const camaraOrganMemberSchema = z.object({
  uriOrgao: apiUri("orgaos"),
  siglaOrgao: z.string(),
  nomeOrgao: z.string(),
  nomePublicacaoOrgao: z.string(),
  uriDeputado: apiUri("deputados"),
  cargo: z.string().min(1),
  dataInicio: z.string().regex(LOCAL_DATE),
  dataFim: DATE_OR_EMPTY,
});
export type CamaraOrganMember = z.infer<typeof camaraOrganMemberSchema>;
export const camaraOrganMembersFileSchema = z.object({ dados: z.array(camaraOrganMemberSchema) });

// ---- Arquivo: eventosRequerimentos-{ano} ----

export const camaraEventRequestSchema = z.object({
  idEvento: z.number().int().positive(),
  tituloRequerimento: z.string(),
  uriRequerimento: apiUri("proposicoes"),
});
export type CamaraEventRequest = z.infer<typeof camaraEventRequestSchema>;
export const camaraEventRequestsFileSchema = z.object({ dados: z.array(camaraEventRequestSchema) });

// ---- Arquivo: proposicoesAutores-{ano} ----

export const camaraPropositionAuthorSchema = z.object({
  idProposicao: z.number().int().positive(),
  /** Só existe quando o autor é deputado. */
  idDeputadoAutor: z.number().int().positive().optional(),
  codTipoAutor: z.number().int(),
  tipoAutor: z.string(),
  nomeAutor: z.string(),
  /** "1" = primeiro signatário. */
  ordemAssinatura: z.string().regex(/^\d+$/),
  /** "1" = proponente; "0" = assinatura de apoio. */
  proponente: z.enum(["0", "1"]),
});
export type CamaraPropositionAuthor = z.infer<typeof camaraPropositionAuthorSchema>;
export const camaraPropositionAuthorsFileSchema = z.object({
  dados: z.array(camaraPropositionAuthorSchema),
});

// ---- Arquivos: proposicoes-{ano} e proposicoesTemas-{ano}; API: /referencias/proposicoes/codTema ----

export const camaraPropositionSchema = z.object({
  id: z.number().int().positive(),
  siglaTipo: z.string(),
  codTipo: z.number().int(),
  descricaoTipo: z.string(),
  dataApresentacao: z.string().regex(LOCAL_DATE_TIME),
  /** Proposição à qual esta está apensada (tramitando em conjunto), ou "". */
  uriPropPrincipal: z.union([z.literal(""), apiUri("proposicoes")]),
  uriOrgaoNumerador: apiUri("orgaos"),
  ultimoStatus: z.object({
    /** Código da situação atual ("" quando não informada). */
    idSituacao: z.string().regex(/^\d*$/),
    descricaoSituacao: z.string(),
  }),
});
export type CamaraProposition = z.infer<typeof camaraPropositionSchema>;
export const camaraPropositionsFileSchema = z.object({ dados: z.array(camaraPropositionSchema) });

export const camaraPropositionThemeSchema = z.object({
  uriProposicao: apiUri("proposicoes"),
  codTema: z.number().int(),
  tema: z.string(),
});
export type CamaraPropositionTheme = z.infer<typeof camaraPropositionThemeSchema>;
export const camaraPropositionThemesFileSchema = z.object({
  dados: z.array(camaraPropositionThemeSchema),
});

export const camaraThemeRefSchema = z.object({
  cod: z.string().regex(/^\d+$/),
  nome: z.string().min(1),
});
export const camaraThemeRefsSchema = z.object({ dados: z.array(camaraThemeRefSchema) });

// ---- API: /deputados/{id}/discursos ----

export const camaraDiscourseSchema = z.object({
  dataHoraInicio: z.string().regex(LOCAL_DATE_TIME_MINUTES, "esperado AAAA-MM-DDTHH:mm"),
  faseEvento: z.object({ titulo: z.string().nullable() }).nullable(),
  tipoDiscurso: z.string(),
});
export type CamaraDiscourse = z.infer<typeof camaraDiscourseSchema>;
export const camaraDiscoursesPageSchema = apiPageSchema(camaraDiscourseSchema);
