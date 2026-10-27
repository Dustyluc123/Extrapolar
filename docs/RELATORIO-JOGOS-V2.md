# Relatório — Analytics + jogos com cara de "mesa de votação"

Execução de 27 de outubro de 2026, depois da aprovação do plano (`docs/PLANO-JOGOS-V2.md`), com um commit por etapa. Nada foi enviado ao GitHub (sem `git push`).

## Resumo

- **As visitas passam a ser contadas** com o Vercel Web Analytics, em todas as páginas. Só visualizações de página: sem eventos, sem cookies e nada dos jogos. Falta você ativar no painel da Vercel (`docs/DEPLOY.md`).
- **Os quatro jogos viraram uma mesa de votação.** Sobre um mata-borrão ficam:
  - o ofício em papel timbrado do Extrapolar;
  - os carimbos SIM e NÃO;
  - o crachá;
  - um botão de som.
- **As regras e a pontuação não mudaram** (`@extrapolar/games` intacto).
- **Verificações:** formatação, lint, neutralidade, tipos, **262 testes** e build passam. O axe não acha violações nos jogos nos dois temas, em três momentos: estado inicial, no meio do jogo e depois de jogar. Nenhuma captura de celular tem rolagem lateral.

| Commit    | Etapa                                                         |
| --------- | ------------------------------------------------------------- |
| `a391a78` | 1 — Vercel Web Analytics, privacidade no Sobre, ADR 0024      |
| `eced6b1` | 2 — Base da mesa (peças, tokens, som), ADR 0025               |
| `7848ebf` | 3 — Seja deputado: ofício, carimbos e painel do plenário      |
| `95dd7c2` | 4 — Vote você também: pilha, bandeja "Para depois", relatório |
| `eb6fa72` | 5 — Placar: ofício e boletim de palpite                       |
| `91857b4` | 6 — Dle: investigação de arquivo                              |
| (este)    | 7 — Fechamento: a11y, capturas, peso, docs, relatório         |

## O que mudou

### Analytics

- `@vercel/analytics` 2.0.1 com `<Analytics />` no fim do `BaseLayout.astro`.
- O componente conta o caminho da página. Por garantia, um `beforeSend` tira a query string e a âncora antes do envio, porque os critérios do `/ranking` ficam na URL.
- No `pnpm dev`, o Analytics só mostra no console. No preview local, o navegador avisa que `/_vercel/insights/script.js` não existe; o site não quebra.
- "Sobre" ganhou a seção **Privacidade**. O aviso dos jogos virou "Suas respostas ficam só neste aparelho e nunca são enviadas", com link para ela.

### Mesa de votação (todos os jogos)

- **Peças** em `components/games/desk/`, estilos em `styles/desk.css` (só nas páginas dos jogos). Os tokens novos e os contrastes estão no `docs/DESIGN.md`, seção "Mesa de votação".
- **Carimbos SIM e NÃO:** botões comuns (toque, clique, teclado), com o mesmo desenho, a mesma cor e o mesmo som.
- **Marca de tinta torta:** a inclinação é fixa para cada votação (`lib/games/tilt.ts`, com teste).
- **Som opcional:** gerado com Web Audio, sem arquivos. Desligado por padrão, com o botão "Som" sempre visível e a escolha guardada no navegador.
- **Foco e anúncio:** depois do carimbo, o foco vai para o resultado e um `aria-live` anuncia o voto e o resultado oficial.
- **Movimento:** todas as animações ficam dentro de `prefers-reduced-motion: no-preference`. Com redução de movimento, o carimbo aparece pronto.

### Cada jogo

- **Seja deputado:**
  - ofício "Votação mais recente" e carimbos;
  - depois do voto, a marca no ofício e um papel novo por cima com o painel do plenário;
  - o painel tem 513 luzes do placar oficial: Sim cheia, Não hachurada, outros vazados e "sem voto registrado";
  - por fim, o carimbo APROVADA ou REJEITADA. A lista "Quem votou o quê" continua embaixo.
- **Vote você também:**
  - pilha com os 10 documentos, carimbados ou separados para depois;
  - os separados voltam no fim; dá para carimbar ou deixar em branco, um por um ou todos de uma vez;
  - o relatório final sai em papel timbrado.
- **Placar:**
  - ofício e boletim em papel pautado, com quadradinhos para a maioria do estado e uma régua para a porcentagem;
  - na revelação, a tabela "Seu boletim × resultado oficial" e a marca "Conferido".
- **Dle:**
  - pasta secreta com as pistas já confirmadas e o campo de chute;
  - cada chute vira uma ficha, com as pistas em abas de fichário (mesmas cores e símbolos);
  - no fim, a pasta abre com a foto em meio-tom.

## Decisões que tomei sozinho

As marcadas com ⚠ mudam o que o leitor vê. Todas estão no ADR 0025 ou no `docs/DESIGN.md`.

- ⚠ **Sem "urgente" no ofício:** "regime de urgência" é termo real da Câmara e confundiria. A etiqueta do Seja deputado é "Votação mais recente".
- ⚠ **Timbre próprio:** o timbre é do Extrapolar e diz "documento de jogo com dados oficiais", para não parecer papel oficial da Câmara. O número no documento é o da própria proposição.
- ⚠ **Painel do plenário:** usa o placar oficial (Sim, Não, outros). Os assentos até 513 aparecem como "sem voto registrado".
- ⚠ **"Separar para depois":**
  - os separados voltam antes do relatório;
  - "deixar em branco" equivale ao antigo "pular" (não entra na conta);
  - o progresso guardado ganhou o campo opcional `later`, e quem já tinha jogado a semana não perde nada;
  - o "Como jogar" e a metodologia foram atualizados.
- ⚠ **Dle:** a pasta secreta mostra as pistas que alguma ficha já acertou. Isso só reúne o que as fichas já mostram; o jogo não ficou mais fácil.
- ⚠ **Crachá:** o do Seja deputado conta quantas votações foram carimbadas neste aparelho, lendo o que já fica guardado. As estatísticas do Dle e do Placar saíram do pé da revelação e foram para o crachá.
- **Limpeza:** o `VoteCard` e o `StatsLine` saíram (sem uso). Ficaram só os links oficiais e a barra do placar.
- **Verificações de acessibilidade ampliadas:**
  - o `check:a11y` passou a auditar os quatro jogos no estado inicial;
  - o `check:a11y:jogos` ganhou três momentos do meio do jogo: Dle em andamento, boletim do Placar aberto e bandeja "Para depois".
- **Peso das páginas:** script novo `scripts/page-weight.mjs`.

## Peso (gzip, HTML + CSS + JS que a página carrega)

| Página                    | Antes    | Depois   | Diferença |
| ------------------------- | -------- | -------- | --------- |
| `/jogos/dle`              | 91,1 KB  | 98,0 KB  | +6,9 KB   |
| `/jogos/placar`           | 97,0 KB  | 104,9 KB | +7,9 KB   |
| `/jogos/vote-voce-tambem` | 105,2 KB | 113,2 KB | +8,0 KB   |
| `/jogos/seja-deputado`    | 100,9 KB | 109,1 KB | +8,2 KB   |
| `/ranking`                | 88,2 KB  | 89,8 KB  | +1,6 KB   |
| `/sobre`                  | 11,7 KB  | 13,5 KB  | +1,8 KB   |

A diferença vem de três partes:

- cerca de 3,7 KB do CSS da mesa;
- 2 a 3 KB de JavaScript dos componentes e do som;
- cerca de 1,5 KB por página do Analytics e da seção de privacidade.

O script da Vercel (`/_vercel/insights/script.js`, alguns KB) carrega depois e não entra na conta. Nenhuma biblioteca de animação foi adicionada.

## Como testar

```bash
pnpm dev                         # http://localhost:4321/jogos
pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build
pnpm --filter @extrapolar/web preview      # em outro terminal
pnpm check:a11y && pnpm check:a11y:jogos
SCREENSHOT_MAX_HEIGHT=3000 pnpm screenshots /jogos/dle /jogos/placar /jogos/vote-voce-tambem /jogos/seja-deputado
node scripts/page-weight.mjs
```

Para conferir à mão:

- jogue cada jogo só com o teclado (Tab até os carimbos, Enter carimba);
- ligue o som no botão da mesa;
- ative "reduzir movimento" no sistema: o carimbo aparece pronto, sem animação;
- troque a edição (dia ou noite) no cabeçalho.

## TODOs que dependem de você

- [ ] Ativar o Web Analytics no painel da Vercel (passo a passo em `docs/DEPLOY.md`).
- [ ] Revisar o ADR 0024 (analytics), o ADR 0025 (mesa) e as decisões ⚠ acima.
- [ ] Ouvir os sons e dizer se o volume ou o timbre precisam de ajuste.
- [ ] `git push` dos 7 commits, quando quiser.
