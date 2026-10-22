// Endereços oficiais da Câmara. Ver docs/FONTES.md.

export const CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2";
export const CAMARA_FILES_BASE = "https://dadosabertos.camara.leg.br/arquivos";
export const CAMARA_PORTAL_URL = "https://dadosabertos.camara.leg.br/";

/** Nome da fonte exibido no site ao lado de cada número. */
export const SOURCE_NAME = "Câmara dos Deputados — Dados Abertos";

export function votesFileUrl(year: number): string {
  return `${CAMARA_FILES_BASE}/votacoes/json/votacoes-${year}.json`;
}

export function ballotsFileUrl(year: number): string {
  return `${CAMARA_FILES_BASE}/votacoesVotos/json/votacoesVotos-${year}.json`;
}

/** Página pública do deputado no site da Câmara. */
export function deputyProfileUrl(deputyId: number): string {
  return `https://www.camara.leg.br/deputados/${deputyId}`;
}
