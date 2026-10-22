// Ponto de entrada do pipeline (`pnpm pipeline`).
// As etapas fetch → normalize → compute → publish entram nas Etapas 4 e 5.
import { PROJECT_NAME } from "@extrapolar/shared";

export function describePipeline(): string {
  return `${PROJECT_NAME}: pipeline ainda sem etapas (Fase 0, Etapa 1).`;
}

// Só executa quando chamado direto pelo tsx, não quando importado nos testes.
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(describePipeline());
}
