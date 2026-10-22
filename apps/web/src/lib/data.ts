// Acesso aos dados do site: implementação de DeputyRepository que lê os JSON gerados
// pelo pipeline (data/generated) no build. Valida com Zod: dado quebrado quebra o build.
// O site nunca chama a API da Câmara (ver CLAUDE.md).
import {
  datasetMetaSchema,
  deputiesFileSchema,
  parseOrThrow,
  participationFileSchema,
  type DatasetMeta,
  type Deputy,
  type DeputyProfile,
  type DeputyRepository,
  type Participation,
  type ParticipationFile,
} from "@extrapolar/shared";
import rawDeputies from "../../../../data/generated/deputados.json";
import rawMeta from "../../../../data/generated/meta.json";
import rawParticipation from "../../../../data/generated/participacao.json";

export class JsonDeputyRepository implements DeputyRepository {
  private readonly deputies: Deputy[];
  private readonly byId: Map<number, Deputy>;
  private readonly participation: Map<number, Participation>;
  private readonly participationFile: ParticipationFile;
  private readonly meta: DatasetMeta;

  constructor(raw: { deputies: unknown; participation: unknown; meta: unknown }) {
    const deputiesFile = parseOrThrow(
      deputiesFileSchema,
      raw.deputies,
      "data/generated/deputados.json",
    );
    this.participationFile = parseOrThrow(
      participationFileSchema,
      raw.participation,
      "data/generated/participacao.json",
    );
    this.meta = parseOrThrow(datasetMetaSchema, raw.meta, "data/generated/meta.json");

    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    this.deputies = [...deputiesFile.deputies].sort(
      (a, b) => collator.compare(a.name, b.name) || a.id - b.id,
    );
    this.byId = new Map(this.deputies.map((deputy) => [deputy.id, deputy]));
    this.participation = new Map(
      this.participationFile.deputies.map((entry) => [entry.deputyId, entry]),
    );
  }

  async listDeputies(): Promise<Deputy[]> {
    return this.deputies;
  }

  async getDeputy(id: number): Promise<DeputyProfile | null> {
    const deputy = this.byId.get(id);
    if (!deputy) return null;
    return { deputy, participation: this.participation.get(id) ?? null };
  }

  async getMeta(): Promise<DatasetMeta> {
    return this.meta;
  }

  async getParticipationSummary(): Promise<Omit<ParticipationFile, "deputies">> {
    const { deputies: _deputies, ...summary } = this.participationFile;
    return summary;
  }
}

/** Repositório usado pelas páginas. Trocar por outra implementação não muda as páginas (ADR 0002). */
export const repository: DeputyRepository = new JsonDeputyRepository({
  deputies: rawDeputies,
  participation: rawParticipation,
  meta: rawMeta,
});
