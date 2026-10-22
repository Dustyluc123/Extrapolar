// Regras do Dle que rodam no navegador (sem import.meta.glob): atributos e exibição.
import type { DleDeputy } from "@extrapolar/shared";
import type { AttributeDefinition, AttributeValue } from "@extrapolar/games";

/** Atributos na ordem em que aparecem no tabuleiro. */
export function dleAttributes(
  federations: Readonly<Record<string, string>>,
): AttributeDefinition[] {
  return [
    { key: "party", label: "Partido", kind: "text", groups: federations },
    { key: "condition", label: "Condição", kind: "text" },
    { key: "since", label: "Na Câmara desde", kind: "number" },
    { key: "birthYear", label: "Nasceu em", kind: "number", tolerance: 5 },
    { key: "birthState", label: "Estado natal", kind: "text" },
    { key: "committees", label: "Comissões (titular)", kind: "list" },
    { key: "projects", label: "Projetos (autor)", kind: "number", relativeTolerance: 0.2 },
  ];
}

export function dleValues(d: DleDeputy): Record<string, AttributeValue> {
  return {
    party: d.party,
    condition: d.condition,
    since: d.since,
    birthYear: d.birthYear,
    birthState: d.birthState,
    committees: d.committees,
    projects: d.projects,
  };
}

/** Texto curto de um valor no tabuleiro. */
export function displayValue(key: string, value: AttributeValue): string {
  if (value === null) return "sem dado";
  if (Array.isArray(value)) return value.length === 0 ? "nenhuma" : value.join(", ");
  if (key === "condition" && value === "Suplente efetivado") return "Suplente efet.";
  return String(value);
}
