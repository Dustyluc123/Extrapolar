// Funções puras que calculam os indicadores. Nada aqui acessa rede ou disco.
// A primeira métrica (participação em votações nominais de plenário) entra na Etapa 5.

/**
 * Divide `part` por `total` e devolve `null` quando não há base de cálculo,
 * para nunca exibir 0% quando na verdade não existe dado.
 */
export function safeRatio(part: number, total: number): number | null {
  if (total <= 0) return null;
  return part / total;
}
