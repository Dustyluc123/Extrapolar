// Filtro com várias escolhas (estado, partido): caixas de seleção dentro de um <details>, para
// funcionar com teclado e leitor de tela sem depender de <select multiple>.

interface Props {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** "Todos", "PL", "PL e PT" ou "PL, PT, PSOL e mais 2". */
function summaryText(selected: string[], labelOf: Map<string, string>): string {
  if (selected.length === 0) return "Todos";
  const names = selected.map((v) => labelOf.get(v) ?? v);
  if (names.length <= 2) return names.join(" e ");
  if (names.length === 3) return `${names[0]}, ${names[1]} e ${names[2]}`;
  return `${names.slice(0, 3).join(", ")} e mais ${names.length - 3}`;
}

export function MultiFilter({ id, label, options, selected, onChange }: Props) {
  const labelOf = new Map(options.map((o) => [o.value, o.label]));
  const chosen = new Set(selected);
  const toggle = (value: string) =>
    onChange(chosen.has(value) ? selected.filter((v) => v !== value) : [...selected, value].sort());
  return (
    <details className="multi-filter">
      <summary className="multi-filter-summary">
        <span className="kicker">{label}</span>{" "}
        <span className="font-sans">{summaryText(selected, labelOf)}</span>
      </summary>
      <fieldset className="multi-filter-panel">
        <legend className="sr-only">{label}: escolha um ou mais</legend>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-3 p-0 sm:grid-cols-3">
          {options.map((o) => {
            const inputId = `${id}-${o.value}`;
            return (
              <li key={o.value}>
                <label htmlFor={inputId} className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    id={inputId}
                    type="checkbox"
                    className="size-4 shrink-0 accent-[var(--color-accent-strong)]"
                    checked={chosen.has(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  {o.label}
                </label>
              </li>
            );
          })}
        </ul>
        {selected.length > 0 ? (
          <button
            type="button"
            className="game-button game-button-ghost game-button-small mt-2"
            onClick={() => onChange([])}
          >
            Limpar ({selected.length})
          </button>
        ) : null}
      </fieldset>
    </details>
  );
}
