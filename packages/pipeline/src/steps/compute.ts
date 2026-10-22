// Etapa 3: calcula as métricas com as funções puras de @extrapolar/metrics e monta
// o detalhe de cada deputado (por caderno) e o índice de métricas para a Fase 2.
import {
  GENERATED_SCHEMA_VERSION,
  type DeputyDetail,
  type MetricIndexEntry,
  type MetricsIndex,
  type MetricValue,
} from "@extrapolar/shared";
import { noData, okValue, participationValue, ratioValue } from "@extrapolar/metrics";
import { log } from "../lib/log";
import type { PipelineContext } from "./context";
import { computeComissoes } from "./metrics/comissoes";
import { computeDinheiro } from "./metrics/dinheiro";
import { computePlenario } from "./metrics/plenario";
import { computeFiscalizacao } from "./metrics/fiscalizacao";
import { computeProjetos } from "./metrics/projetos";
import { computeVoz } from "./metrics/voz";
import type { NormalizedData } from "./normalize";

export interface ComputedData {
  details: DeputyDetail[];
  metricsIndex: MetricsIndex;
  totals: { nominalPlenaryVotes: number; lastNominalVoteDate: string | null };
}

/** Descrição de uma métrica no índice; `pick` tira o valor do detalhe de cada deputado. */
interface MetricDefinition {
  key: string;
  caderno: string;
  label: string;
  unit: MetricIndexEntry["unit"];
  methodologyAnchor: string;
  pick: (detail: DeputyDetail) => MetricValue;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "participacao",
    caderno: "plenario",
    label: "Participação em votações nominais de plenário",
    unit: "proporcao",
    methodologyAnchor: "participacao",
    pick: (d) => participationValue(d.plenario.participacao),
  },
  {
    key: "presenca-sessoes",
    caderno: "plenario",
    label: "Presença em sessões deliberativas do plenário",
    unit: "proporcao",
    methodologyAnchor: "presenca-sessoes",
    pick: (d) =>
      ratioValue(
        d.plenario.presencaSessoes.attendedEvents,
        d.plenario.presencaSessoes.eligibleEvents,
        "sem-sessao-elegivel",
      ),
  },
  {
    key: "alinhamento-partido",
    caderno: "plenario",
    label: "Alinhamento com a orientação do partido",
    unit: "proporcao",
    methodologyAnchor: "alinhamento-partido",
    pick: (d) =>
      ratioValue(
        d.plenario.alinhamentoPartido.alignedVotes,
        d.plenario.alinhamentoPartido.comparableVotes,
        "sem-orientacao-elegivel",
      ),
  },
  {
    key: "alinhamento-governo",
    caderno: "plenario",
    label: "Alinhamento com a orientação do Governo",
    unit: "proporcao",
    methodologyAnchor: "alinhamento-governo",
    pick: (d) =>
      ratioValue(
        d.plenario.alinhamentoGoverno.alignedVotes,
        d.plenario.alinhamentoGoverno.comparableVotes,
        "sem-orientacao-do-governo",
      ),
  },
  {
    key: "comissoes-titular-hoje",
    caderno: "comissoes",
    label: "Comissões em que é titular hoje",
    unit: "contagem",
    methodologyAnchor: "comissoes",
    pick: (d) => okValue(d.comissoes.titularHoje),
  },
  {
    key: "presenca-comissoes",
    caderno: "comissoes",
    label: "Presença nas reuniões das comissões em que é titular",
    unit: "proporcao",
    methodologyAnchor: "presenca-comissoes",
    pick: (d) =>
      !d.comissoes.foiTitular
        ? { status: "sem-dado", reason: "nao-e-titular-de-comissao" }
        : ratioValue(
            d.comissoes.presencaReunioes.attendedEvents,
            d.comissoes.presencaReunioes.eligibleEvents,
            "sem-reuniao-elegivel",
          ),
  },
  {
    key: "eventos-requeridos",
    caderno: "comissoes",
    label: "Eventos realizados a pedido do deputado",
    unit: "contagem",
    methodologyAnchor: "eventos-requeridos",
    pick: (d) => okValue(d.comissoes.eventosRequeridos.total),
  },
  {
    key: "projetos-autor-principal",
    caderno: "projetos",
    label: "Projetos apresentados como autor principal (PL, PLP, PEC, PDL, PRC)",
    unit: "contagem",
    methodologyAnchor: "proposicoes",
    pick: (d) => okValue(d.projetos.autorPrincipal),
  },
  {
    key: "projetos-viraram-norma",
    caderno: "projetos",
    label: "Projetos como autor principal transformados em norma jurídica",
    unit: "proporcao",
    methodologyAnchor: "situacao-proposicoes",
    pick: (d) =>
      ratioValue(
        d.projetos.situacao.viraramNorma,
        d.projetos.autorPrincipal,
        "sem-proposicao-elegivel",
      ),
  },
  {
    key: "pareceres-relator",
    caderno: "projetos",
    label: "Pareceres apresentados como relator",
    unit: "contagem",
    methodologyAnchor: "pareceres",
    pick: (d) => okValue(d.projetos.pareceres.total),
  },
  {
    key: "ric",
    caderno: "fiscalizacao",
    label: "Requerimentos de informação como autor principal",
    unit: "contagem",
    methodologyAnchor: "ric",
    pick: (d) => okValue(d.fiscalizacao.ric.autorPrincipal),
  },
  {
    key: "pfc",
    caderno: "fiscalizacao",
    label: "Propostas de fiscalização e controle como autor principal",
    unit: "contagem",
    methodologyAnchor: "pfc",
    pick: (d) => okValue(d.fiscalizacao.pfc.autorPrincipal),
  },
  {
    key: "convocacoes",
    caderno: "fiscalizacao",
    label: "Requerimentos de convocação de ministros e autoridades como autor principal",
    unit: "contagem",
    methodologyAnchor: "convocacoes",
    pick: (d) => okValue(d.fiscalizacao.convocacoes.autorPrincipal),
  },
  {
    key: "indicacoes",
    caderno: "fiscalizacao",
    label: "Indicações (sugestões ao governo) como autor principal",
    unit: "contagem",
    methodologyAnchor: "indicacoes",
    pick: (d) => okValue(d.fiscalizacao.indicacoes.autorPrincipal),
  },
  {
    key: "discursos",
    caderno: "voz",
    label: "Discursos registrados na legislatura",
    unit: "contagem",
    methodologyAnchor: "discursos",
    pick: (d) => okValue(d.voz.total),
  },
  {
    key: "cota-total",
    caderno: "dinheiro",
    label: "Cota parlamentar gasta na legislatura (valor líquido)",
    unit: "reais",
    methodologyAnchor: "cota",
    pick: (d) => okValue(d.dinheiro.cota.total),
  },
  {
    key: "cota-teto",
    caderno: "dinheiro",
    label: "Cota gasta em relação ao teto oficial (meses com tabela oficial)",
    unit: "proporcao",
    methodologyAnchor: "cota",
    pick: (d) => {
      const last = d.dinheiro.cota.teto.at(-1);
      return last ? okValue(last.proporcao, last.gasto, last.limite) : noData("sem-teto-oficial");
    },
  },
  {
    key: "equipe-secretarios",
    caderno: "dinheiro",
    label: "Secretários parlamentares no gabinete",
    unit: "contagem",
    methodologyAnchor: "equipe",
    pick: (d) =>
      d.dinheiro.equipe.secretarios === null
        ? noData("sem-equipe-no-arquivo")
        : okValue(d.dinheiro.equipe.secretarios),
  },
  {
    key: "emendas-empenhado",
    caderno: "dinheiro",
    label: "Emendas individuais empenhadas (orçamentos de 2024 em diante)",
    unit: "reais",
    methodologyAnchor: "emendas",
    pick: (d) =>
      d.dinheiro.emendas.autor === null
        ? noData("autor-nao-identificado")
        : okValue(d.dinheiro.emendas.total.empenhado),
  },
  {
    key: "emendas-execucao",
    caderno: "dinheiro",
    label: "Execução das emendas: (pago + restos a pagar pagos) ÷ empenhado",
    unit: "proporcao",
    methodologyAnchor: "emendas",
    pick: (d) => {
      const e = d.dinheiro.emendas;
      if (e.autor === null) return noData("autor-nao-identificado");
      return ratioValue(
        e.total.pago + e.total.restosPagos,
        e.total.empenhado,
        "sem-emenda-empenhada",
      );
    },
  },
];

export function compute(context: PipelineContext, data: NormalizedData): ComputedData {
  log.step("Calculando o Caderno 1 — Plenário");
  const plenario = computePlenario(context, data);
  log.step("Calculando o Caderno 2 — Comissões");
  const comissoes = computeComissoes(context, data);
  log.step("Calculando o Caderno 3 — Projetos e leis");
  const projetos = computeProjetos(context, data);
  log.step("Calculando o Caderno 4 — Fiscalização");
  const fiscalizacao = computeFiscalizacao(context, data);
  log.step("Calculando o Caderno 5 — Voz");
  const voz = computeVoz(context, data);
  log.step("Calculando o Caderno 6 — Dinheiro público");
  const dinheiro = computeDinheiro(context, data);

  const details: DeputyDetail[] = data.deputies.map((deputy) => {
    const of = <T>(map: Map<number, T>, caderno: string): T => {
      const value = map.get(deputy.id);
      if (value === undefined) {
        throw new Error(`Caderno "${caderno}" não calculado para o deputado ${deputy.id}.`);
      }
      return value;
    };
    return {
      schemaVersion: GENERATED_SCHEMA_VERSION,
      deputyId: deputy.id,
      plenario: of(plenario, "plenario"),
      comissoes: of(comissoes, "comissoes"),
      projetos: of(projetos, "projetos"),
      fiscalizacao: of(fiscalizacao, "fiscalizacao"),
      voz: of(voz, "voz"),
      dinheiro: of(dinheiro, "dinheiro"),
    };
  });

  const lastVote = data.plenary.votes.at(-1);
  return {
    details,
    metricsIndex: buildMetricsIndex(context.legislature.id, details),
    totals: {
      nominalPlenaryVotes: data.plenary.votes.length,
      lastNominalVoteDate: lastVote ? lastVote.dateTime.slice(0, 10) : null,
    },
  };
}

export function buildMetricsIndex(legislatureId: number, details: DeputyDetail[]): MetricsIndex {
  return {
    schemaVersion: GENERATED_SCHEMA_VERSION,
    legislatureId,
    metrics: METRIC_DEFINITIONS.map(({ pick, ...definition }) => ({
      ...definition,
      values: Object.fromEntries(details.map((detail) => [String(detail.deputyId), pick(detail)])),
    })),
  };
}
