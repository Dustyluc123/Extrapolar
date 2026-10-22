# Resumos de votações em linguagem simples

Os jogos mostram a **ementa oficial** da proposição votada. Quando existir um resumo em linguagem simples **revisado**, ele aparece no lugar da ementa (com a ementa logo abaixo, como fonte).

Um arquivo por votação, com o id da votação no nome (o mesmo de `data/generated/jogos/votacoes.json` e da página `/jogos/votacoes`):

```
content/resumos/2543171-49.md
```

Conteúdo:

```markdown
---
revisado: true
autor: Lucas
data: 2026-10-30
---

O texto aprovado muda a regra X para Y. Em uma ou duas frases, sem adjetivos e sem opinião.
```

Regras:

- `revisado: false` = rascunho: o arquivo é validado, mas o texto **não** vai para o site.
- Só fatos sobre o que o texto muda; nada de "bom", "ruim", "polêmico", nem quem ganha ou perde.
- Cabeçalho malformado faz o pipeline parar com uma mensagem dizendo o arquivo e o problema.
- Um resumo de votação que não é elegível gera um aviso no `meta.json` e não é publicado.

Nesta fase, nenhum resumo foi escrito (nem gerado por IA): é trabalho manual.
