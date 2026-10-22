// Caminhos do repositório usados pelo pipeline.
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/** Raiz do monorepo (packages/pipeline/src/lib → ../../../../). */
export const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

export const RAW_DIR = process.env.EXTRAPOLAR_RAW_DIR ?? join(REPO_ROOT, "data", "raw");
export const GENERATED_DIR =
  process.env.EXTRAPOLAR_GENERATED_DIR ?? join(REPO_ROOT, "data", "generated");

/** Textos escritos à mão (ex.: resumos de votações em linguagem simples). */
export const CONTENT_DIR = process.env.EXTRAPOLAR_CONTENT_DIR ?? join(REPO_ROOT, "content");
