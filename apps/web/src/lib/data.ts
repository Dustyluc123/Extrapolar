// Acesso aos dados do site: implementação de DeputyRepository que lê os JSON gerados
// pelo pipeline (data/generated) no build. Valida com Zod: dado quebrado quebra o build.
// O site nunca chama a API da Câmara (ver CLAUDE.md).
import {
  datasetMetaSchema,
  deputiesFileSchema,
  deputyDetailSchema,
  frontsIndexSchema,
  metricsIndexSchema,
  parseOrThrow,
  type DatasetMeta,
  type Deputy,
  type DeputyDetail,
  type DeputyProfile,
  type DeputyRepository,
  type FrontsIndex,
  type MetricsIndex,
} from "@extrapolar/shared";
import rawDeputies from "../../../../data/generated/deputados.json";
import rawMeta from "../../../../data/generated/meta.json";
import rawMetrics from "../../../../data/generated/metricas.json";
import rawFronts from "../../../../data/generated/frentes.json";

// Um arquivo por deputado (ADR 0012), carregados no build.
const rawDetails = import.meta.glob("../../../../data/generated/deputados/*.json", {
  eager: true,
  import: "default",
});

export interface RawData {
  deputies: unknown;
  details: Record<string, unknown>;
  meta: unknown;
  metrics: unknown;
  fronts: unknown;
}

export class JsonDeputyRepository implements DeputyRepository {
  private readonly deputies: Deputy[];
  private readonly byId: Map<number, Deputy>;
  private readonly details = new Map<number, DeputyDetail>();
  private readonly rawDetails: Map<number, { path: string; data: unknown }>;
  private readonly meta: DatasetMeta;
  private readonly metrics: MetricsIndex;
  private readonly fronts: FrontsIndex;

  constructor(raw: RawData) {
    const deputiesFile = parseOrThrow(
      deputiesFileSchema,
      raw.deputies,
      "data/generated/deputados.json",
    );
    this.meta = parseOrThrow(datasetMetaSchema, raw.meta, "data/generated/meta.json");
    this.metrics = parseOrThrow(metricsIndexSchema, raw.metrics, "data/generated/metricas.json");
    this.fronts = parseOrThrow(frontsIndexSchema, raw.fronts, "data/generated/frentes.json");

    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    this.deputies = [...deputiesFile.deputies].sort(
      (a, b) => collator.compare(a.name, b.name) || a.id - b.id,
    );
    this.byId = new Map(this.deputies.map((deputy) => [deputy.id, deputy]));
    this.rawDetails = new Map(
      Object.entries(raw.details).map(([path, data]) => {
        const id = Number(/(\d+)\.json$/.exec(path)?.[1]);
        return [id, { path, data }];
      }),
    );
    for (const deputy of this.deputies) {
      if (!this.rawDetails.has(deputy.id)) {
        throw new Error(`Falta data/generated/deputados/${deputy.id}.json para ${deputy.name}.`);
      }
    }
  }

  async listDeputies(): Promise<Deputy[]> {
    return this.deputies;
  }

  async getDeputy(id: number): Promise<DeputyProfile | null> {
    const deputy = this.byId.get(id);
    if (!deputy) return null;
    let detail = this.details.get(id);
    if (!detail) {
      const raw = this.rawDetails.get(id);
      detail = parseOrThrow(deputyDetailSchema, raw?.data, `data/generated/deputados/${id}.json`);
      this.details.set(id, detail);
    }
    return { deputy, detail };
  }

  async getMeta(): Promise<DatasetMeta> {
    return this.meta;
  }

  async getMetricsIndex(): Promise<MetricsIndex> {
    return this.metrics;
  }

  async getFronts(): Promise<FrontsIndex> {
    return this.fronts;
  }
}

/** Repositório usado pelas páginas. Trocar por outra implementação não muda as páginas (ADR 0002). */
export const repository: DeputyRepository = new JsonDeputyRepository({
  deputies: rawDeputies,
  details: rawDetails,
  meta: rawMeta,
  metrics: rawMetrics,
  fronts: rawFronts,
});
