# 0022 — Resumos das votações: rascunho com IA, revisão humana

**Status:** aceito (26/10/2026) — pedido do Lucas depois da Fase 2

## Contexto

Os jogos mostram a ementa oficial das proposições, que é difícil para quem não acompanha política ("Altera a Lei Complementar nº 123…"). O ADR 0019 previa resumos em linguagem simples escritos à mão (`content/resumos/`, só publicados com `revisado: true`), mas nenhum foi escrito: são cerca de 60 votações em uso e algumas novas por semana.

## Decisão

- Um comando do Claude Code, `/resumos` (`.claude/commands/resumos.md`), lista as votações usadas pelos jogos sem resumo (`node scripts/resumos.mjs pendentes`), baixa as fontes oficiais (`node scripts/resumos.mjs fontes <id>`: votação e proposição na API, parecer citado na votação, redação final ou substitutivo e inteiro teor, PDF → texto) e escreve um **rascunho** por votação com `revisado: false`.
- **Formato:** seções "O que estava em votação" (2 ou 3 frases, sem jargão, o que muda para pessoas, empresas ou governo), "Curiosidade" (opcional: como a Câmara funciona — quórum, dois turnos, origem no Senado, medida provisória) e "Dúvidas" (o que não foi possível confirmar no texto oficial; nunca publicada). Único link aceito: termos do glossário, `[termo](/glossario#slug)`; slug inexistente quebra o build.
- **Nunca inventar:** o rascunho só diz o que está no texto oficial; o que não for confirmado vai para "Dúvidas". O pipeline recusa `revisado: true` com "Dúvidas" ainda no arquivo.
- **Só o Lucas marca `revisado: true`**, depois de comparar com o texto oficial na página `/dev/resumos` (existe só em `pnpm dev`; `getStaticPaths` devolve lista vazia no build).
- A varredura de neutralidade passa a ler também `content/resumos/`.

## Alternativas descartadas

- **Gerar o resumo no pipeline, com uma API de IA:** custo recorrente, chave secreta no GitHub Actions e texto publicado sem revisão.
- **Publicar rascunhos com aviso "gerado por IA":** contraria o princípio "todo número é verificável" e o ADR 0019; um erro de interpretação vira fato no site.
- **Só a ementa reescrita:** a ementa não diz o que o substitutivo mudou; por isso o comando lê a redação final ou o parecer.

## Consequências

- Rotina semanal (no `CLAUDE.md`): rodar `/resumos` e revisar.
- `plainSummary` nos JSON dos jogos virou objeto `{ text, curiosity }` (antes era texto); como nenhum resumo tinha sido publicado, a versão do esquema não mudou.
- O rascunho pode errar ao interpretar um texto jurídico longo (substitutivos com dezenas de artigos): a revisão humana é obrigatória, e a ementa oficial continua sempre visível logo abaixo do resumo.
- `unpdf` (dependência só de desenvolvimento, na raiz) extrai o texto dos PDFs da Câmara.
