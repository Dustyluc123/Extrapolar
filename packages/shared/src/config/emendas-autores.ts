// Correspondências manuais entre autores de emendas na base da CGU e deputados da Câmara.
// A ligação automática é por nome normalizado exato e único dos dois lados (ADR 0018); use este
// arquivo só para casos conferidos à mão em fonte oficial. Nunca ligue por palpite.
//
// Formato: id do deputado na Câmara → código do autor na CGU ("Código do Autor da Emenda"),
// ou null para dizer explicitamente que o deputado não tem autor correspondente.

export const MANUAL_AMENDMENT_AUTHORS: Record<number, string | null> = {
  // Nenhuma correspondência manual por enquanto. Candidatos a conferir: docs/RELATORIO-FASE1.md.
};
