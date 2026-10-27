# Resumos de votações em linguagem simples

Os jogos mostram a **ementa oficial** da proposição votada. Quando existir um resumo em linguagem simples **revisado**, ele aparece no lugar da ementa (com a ementa logo abaixo, como fonte). ADRs 0019 e 0022.

Um arquivo por votação, com o id da votação no nome (o mesmo de `data/generated/jogos/votacoes.json` e da página `/jogos/votacoes`):

```
content/resumos/2543171-49.md
```

Conteúdo:

```markdown
---
revisado: false
autor: Claude (rascunho)
data: 2026-10-26
fonte: https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=...
---

## O que estava em votação

O texto muda a regra X para Y. Duas ou três frases simples, sem jargão, com termos técnicos
inevitáveis ligados ao glossário, como [PEC](/glossario#pec).

## Curiosidade

Um fato sobre como a Câmara funciona (opcional).

## Dúvidas

- O que não foi possível confirmar no texto oficial (nunca vai para o site).
```

Como funciona:

- **Rascunhos:** o comando `/resumos` do Claude Code (`.claude/commands/resumos.md`) escreve os arquivos que faltam com `revisado: false`. Ele nunca altera um arquivo que já existe.
- **Revisão:** em `pnpm dev`, abra http://localhost:4321/dev/resumos (ementa e rascunho lado a lado). Confira com o texto oficial (`fonte`), resolva e apague a seção "Dúvidas", ponha seu nome em `autor` e troque para `revisado: true`.
- `revisado: false` = rascunho: o arquivo é validado, mas o texto **não** vai para o site.

Regras:

- Só fatos sobre o que o texto muda; nada de adjetivos de valor, argumentos a favor ou contra, nem quem ganha ou perde. A varredura `pnpm check:neutralidade` também lê esta pasta.
- Seções aceitas, nesta ordem: "O que estava em votação" (obrigatória para revisar), "Curiosidade" e "Dúvidas". Cada seção vira um parágrafo.
- Único link aceito: `[termo](/glossario#slug)`, com slug de `apps/web/src/lib/glossary.ts` (termo inexistente quebra o build).
- Cabeçalho ou seção malformados fazem o pipeline parar com uma mensagem dizendo o arquivo e o problema; `revisado: true` com "Dúvidas" no arquivo também.
- Um resumo de votação que não é elegível gera um aviso no `meta.json` e não é publicado.
