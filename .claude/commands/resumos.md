---
description: Escreve rascunhos de resumos em linguagem simples das votações dos jogos (content/resumos), com revisado false
argument-hint: "[idVotacao ...] (opcional: só estas votações)"
---

# /resumos — rascunhos de resumos das votações dos jogos

Objetivo: para cada votação usada pelos jogos que ainda não tem arquivo em `content/resumos/`, escrever um **rascunho** em linguagem simples, a partir da ementa e do texto oficial. O Lucas revisa e marca `revisado: true`; **você nunca marca um resumo como revisado**.

Antes de tudo, leia `content/resumos/LEIA-ME.md` (formato e regras) e a seção "Princípios inegociáveis" do `CLAUDE.md`.

## 1. Liste as pendentes

```bash
git pull --rebase
node scripts/resumos.mjs pendentes
```

O script lista as votações elegíveis usadas hoje pelos jogos — Placar (últimos 12 meses), Vote você também (rodada da semana) e Seja deputado (a mais recente) — que ainda **não têm arquivo** em `content/resumos/`. Se vierem ids como argumento (`$ARGUMENTS`), trate só esses. Nunca sobrescreva um arquivo que já existe (nem rascunho, nem revisado).

## 2. Baixe as fontes oficiais

```bash
node scripts/resumos.mjs fontes <id> [<id> ...]
```

Para cada votação, o script grava em `data/raw/resumos/{id}/` (fora do Git):

- `FONTES.md`: descrição oficial do resultado, abertura da votação (turno), ementa, ementa detalhada, autores, regime, situação atual e o último texto apresentado antes da votação (parecer de plenário);
- `texto-final.txt`: a **redação final** (o texto como a Câmara aprovou) ou, se ainda não houver, o substitutivo mais recente (veja "Texto final usado" em `FONTES.md`) — é a melhor fonte para votações aprovadas; atenção: a redação final reflete também os destaques e turnos seguintes;
- `texto-votado.txt`: o último parecer citado na votação (às vezes só o parecer às emendas de plenário);
- `texto-original.txt`: o inteiro teor da proposição como apresentada;
- `api.json`: as respostas da API, para conferir.

Se um texto não baixou ou veio sem texto (PDF de imagem), abra o PDF com a ferramenta Read (`pages`) ou use só o que estiver em `FONTES.md` — e registre isso em "Dúvidas".

## 3. Leia o que foi votado

- Comece por `FONTES.md`. Para votação aprovada, leia os artigos do `texto-final.txt`. Depois, para entender, o **relatório e o voto** do `texto-votado.txt` (a parte "I - RELATÓRIO" costuma explicar o projeto em poucas linhas; o substitutivo vem no fim). Se não houver texto votado, leia a justificação e os artigos do `texto-original.txt`.
- Quando o que foi votado é um **substitutivo**, o resumo descreve o substitutivo (o texto final), não o projeto original.
- PEC com primeiro e segundo turno: são duas votações do mesmo texto; os dois arquivos podem ter o mesmo "O que estava em votação" e curiosidades diferentes.
- Votação **rejeitada**: diga o que o texto propunha ("O texto propunha…") e que ele não foi aprovado; o quórum exigido pode ir para a curiosidade.

## 4. Escreva o arquivo

`content/resumos/{idVotacao}.md`:

```markdown
---
revisado: false
autor: Claude (rascunho)
data: AAAA-MM-DD
fonte: <link do texto oficial que você leu (texto-votado ou texto-original, de FONTES.md)>
---

## O que estava em votação

Duas ou três frases simples.

## Curiosidade

Um fato sobre como a Câmara funciona (opcional).

## Dúvidas

- O que você não conseguiu confirmar no texto oficial (só quando houver).
```

**"O que estava em votação"** — 2 ou 3 frases, para alguém que nunca acompanhou política:

- o que muda na vida das pessoas, das empresas ou do governo (quem é afetado e como), com os números do texto oficial quando ajudarem (valores, prazos, quantidades);
- sem jargão: "lei complementar", "dispõe sobre", "altera a Lei nº…" viram linguagem de conversa; nada de número de artigo ou de lei, a não ser o nome conhecido (ex.: Código Civil);
- sem argumentos a favor ou contra, sem dizer quem ganha ou perde, sem adjetivos de valor ("importante", "polêmico", "histórico", "justo", "bom", "ruim"…) e sem as palavras da lista de `scripts/lib/neutrality-words.mjs`;
- só o que está escrito no texto oficial; não use o que você "sabe" sobre o tema, notícias ou a justificativa como se fosse efeito do texto. A justificação do autor é opinião dele: não a reproduza como fato.

**"Curiosidade"** (opcional) — um fato que ensine como a Câmara funciona, verificável nas fontes: quórum (PLP precisa de 257 votos Sim; PEC, de 308, em dois turnos), PEC em dois turnos, projeto que veio do Senado ou que volta para lá, medida provisória (já vale como lei e perde a validade se não for votada no prazo), urgência, substitutivo, quem apresentou (Presidência da República, Senado, tribunal, deputados). Nada sobre deputados, partidos ou posições.

**Termos técnicos inevitáveis** levam link para o glossário do site no formato `[termo](/glossario#slug)` — por exemplo `[PEC](/glossario#pec)`, `[lei complementar](/glossario#plp)`. Os slugs válidos estão em `apps/web/src/lib/glossary.ts`; slug inexistente quebra o build quando o resumo for revisado. Se faltar um termo no glossário, acrescente a entrada lá (definição descritiva e factual, sem juízo de valor) e cite na resposta final. Nenhum outro link é aceito no texto.

**Nunca invente.** Se não conseguir entender o texto oficial (texto ausente, ilegível, técnico demais), escreva **só o que tiver certeza** (no mínimo, reescreva a ementa em linguagem simples) e descreva a dúvida na seção "Dúvidas". Essa seção nunca vai para o site, e o pipeline recusa `revisado: true` enquanto ela existir.

## 5. Confira e informe

```bash
pnpm --filter @extrapolar/pipeline exec vitest run tests/games-data.test.ts
pnpm check:neutralidade
node scripts/resumos.mjs pendentes
```

O teste `games-data` lê todos os arquivos de `content/resumos/` com o mesmo leitor do pipeline: cabeçalho, seção ou link malformado aparece ali com o nome do arquivo. A página `/dev/resumos` (em `pnpm dev`) também mostra o erro, os termos fora do glossário e as palavras da lista de neutralidade.

No fim, diga ao Lucas quantos rascunhos foram criados, quais têm "Dúvidas" e quais termos entraram no glossário, e lembre que a revisão é em **http://localhost:4321/dev/resumos** (`pnpm dev`). Não marque nada como revisado e não faça `git push`.
