// Converte a lista da Câmara (deputados em exercício + histórico) no formato de deputados.json.
import {
  deputyProfileUrl,
  foldText,
  type CamaraDeputyListItem,
  type CamaraHistoryEvent,
  type Deputy,
} from "@extrapolar/shared";
import type { QualityLog } from "./quality";
import { buildServicePeriods } from "./service-periods";
import { withSeconds } from "../lib/time";

const ELECTORAL_CONDITION_LABELS: Record<string, Deputy["electoralCondition"]> = {
  titular: "Titular",
  suplente: "Suplente",
  efetivado: "Suplente efetivado",
};

export interface DeputyWithHistory {
  item: CamaraDeputyListItem;
  history: CamaraHistoryEvent[];
}

/** Última condição eleitoral informada no histórico da legislatura. */
export function latestElectoralCondition(
  history: readonly CamaraHistoryEvent[],
  legislatureId: number,
  quality: QualityLog,
): Deputy["electoralCondition"] {
  const latest = history
    .filter((event) => event.idLegislatura === legislatureId && event.condicaoEleitoral)
    .sort((a, b) => withSeconds(a.dataHora).localeCompare(withSeconds(b.dataHora)))
    .at(-1);
  if (!latest?.condicaoEleitoral) return null;
  const label = ELECTORAL_CONDITION_LABELS[foldText(latest.condicaoEleitoral)];
  if (label === undefined) {
    quality.add(
      "condicao-eleitoral-desconhecida",
      `Condição eleitoral não reconhecida ("${latest.condicaoEleitoral}"); exibida como sem dado.`,
    );
    return null;
  }
  return label;
}

export function normalizeDeputies(
  entries: readonly DeputyWithHistory[],
  legislatureId: number,
  referenceDateTime: string,
  quality: QualityLog,
): Deputy[] {
  const seen = new Set<number>();
  const deputies: Deputy[] = [];
  for (const { item, history } of entries) {
    if (seen.has(item.id)) {
      quality.add(
        "deputado-duplicado",
        "Deputado repetido na lista da Câmara; mantida uma entrada.",
      );
      continue;
    }
    seen.add(item.id);
    if (item.idLegislatura !== legislatureId) {
      throw new Error(
        `Deputado ${item.id} veio com legislatura ${item.idLegislatura}, esperado ${legislatureId}. ` +
          "Confira CURRENT_LEGISLATURE_ID em packages/shared/src/legislature.ts.",
      );
    }
    const periods = buildServicePeriods(history, legislatureId, referenceDateTime);
    const current = periods.at(-1);
    const inServiceSince = current && current.end === null ? current.start : null;
    if (inServiceSince === null) {
      quality.add(
        "em-exercicio-sem-periodo-aberto",
        "Deputado listado como em exercício, mas o histórico não tem período em exercício aberto.",
      );
    }
    deputies.push({
      id: item.id,
      name: item.nome.trim(),
      party: item.siglaPartido.trim(),
      state: item.siglaUf.trim().toUpperCase(),
      photoUrl: item.urlFoto,
      profileUrl: deputyProfileUrl(item.id),
      status: "Em exercício",
      electoralCondition: latestElectoralCondition(history, legislatureId, quality),
      inServiceSince,
    });
  }
  return deputies.sort(compareByName);
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

export function compareByName(a: { name: string; id: number }, b: { name: string; id: number }) {
  return collator.compare(a.name, b.name) || a.id - b.id;
}
