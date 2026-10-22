// Registro de inconsistências encontradas nos dados de origem.
// Não impedem a publicação; vão para meta.json e para o log do pipeline.

export interface QualityIssue {
  code: string;
  message: string;
  count: number;
}

export class QualityLog {
  private readonly issues = new Map<string, QualityIssue>();

  add(code: string, message: string, count = 1): void {
    const existing = this.issues.get(code);
    if (existing) existing.count += count;
    else this.issues.set(code, { code, message, count });
  }

  list(): QualityIssue[] {
    return [...this.issues.values()].sort((a, b) => a.code.localeCompare(b.code));
  }
}
