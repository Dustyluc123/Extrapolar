import type { z } from "zod";

/** Erro de validação com mensagem legível, usado para o pipeline falhar sem publicar dado quebrado. */
export class DataValidationError extends Error {
  constructor(
    readonly label: string,
    readonly details: string,
  ) {
    super(`Dados inválidos em ${label}:\n${details}`);
    this.name = "DataValidationError";
  }
}

/**
 * Valida `data` com `schema`. Se falhar, lança DataValidationError com o caminho
 * de cada campo problemático (ex.: "dados[12].siglaUf").
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  label: string,
): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.slice(0, 10).map((issue) => {
    const path = formatPath(issue.path);
    return `  - ${path || "(raiz)"}: ${issue.message}`;
  });
  const extra = result.error.issues.length - lines.length;
  if (extra > 0) lines.push(`  … e mais ${extra} problema(s)`);
  throw new DataValidationError(label, lines.join("\n"));
}

function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((part, index) =>
      typeof part === "number" ? `[${part}]` : `${index === 0 ? "" : "."}${String(part)}`,
    )
    .join("");
}
