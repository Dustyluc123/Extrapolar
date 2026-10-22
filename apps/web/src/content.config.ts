// Coleções de conteúdo: a metodologia vem direto de docs/METODOLOGIA.md (fonte única do texto).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({ pattern: "METODOLOGIA.md", base: "../../docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { docs };
