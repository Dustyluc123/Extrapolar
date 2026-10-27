# Plano — Analytics + jogos com cara de "mesa de votação"

Briefing: `prompt-ct-analytics-e-jogos.md` (27/10/2026). Um commit por etapa, sem `git push`. Relatório final em `docs/RELATORIO-JOGOS-V2.md`.

## Decisões tomadas no planejamento (Lucas)

- **Mesa:** mata-borrão (feltro verde-escuro discreto, só CSS), com régua e clipe de papel.
- **Som:** desligado por padrão, com botão "Som" bem visível na mesa; preferência salva no navegador.
- **Vote você também:** "pular" vira "separar para depois". Os separados voltam antes do relatório final; quem quiser encerra com eles em branco. A conta de concordância não muda (em branco continua fora).
- **Seja deputado:** revelação num "painel do plenário" com as luzes acendendo, seguido do carimbo oficial.

## Etapa 1 — Vercel Web Analytics

- `@vercel/analytics` + `<Analytics />` de `@vercel/analytics/astro` no `BaseLayout.astro` (todas as páginas). Em `pnpm dev` ele fica em modo de depuração (não envia); no preview local o script de `/_vercel/insights` não existe e a falha é silenciosa — conferir que não aparece erro na tela nem quebra o axe.
- Só visualizações de página: sem `track()`, sem `beforeSend` com dados dos jogos. As escolhas dos jogos não entram na URL (o ranking tem critérios na URL; o Analytics conta só o caminho — confirmar e, se preciso, cortar a query string com `beforeSend`).
- "Sobre": nova seção "Privacidade" (duas frases). Conferir o texto "Nada é enviado" dos jogos (continua verdadeiro: o jogo não envia nada; a visita é contada).
- `docs/DEPLOY.md`: passo "ativar o Web Analytics no painel da Vercel".
- ADR 0024 (analytics: o que é contado e o que nunca é).

## Etapa 2 — A mesa (base comum)

- Medir antes: peso (bruto e gzip) do HTML + JS + CSS de cada página de jogo no `dist`.
- `styles/desk.css` (importado só nos jogos): mesa de mata-borrão, papel timbrado ("ofício"), clipe, régua, crachá, carimbos SIM/NÃO (botões de verdade), marca de tinta torta, papel que desliza por cima, painel do plenário. Tokens novos em `tokens.css` para os dois temas, com contraste AA conferido e anotado no DESIGN.md.
- Componentes React em `components/games/desk/`: `Desk`, `Oficio` (documento da votação; substitui o `VoteCard` nos jogos, com os mesmos dados), `StampPad` (dois carimbos, toque e teclado, `aria-live`), `InkMark` (marca do carimbo; inclinação fixa derivada do id da votação, para não mudar a cada visita), `Badge` (crachá com sequência e estatísticas), `SoundToggle`.
- Som: `lib/games/sound.ts`, Web Audio sem arquivos (padrão do Chutaí): batida do carimbo, papel deslizando, painel acendendo. Só toca depois de ligado e de uma interação; nunca com a aba escondida. Preferência em `localStorage` (`extrapolar:jogos:som`), com try/catch.
- Animações só em CSS, curtas, dentro de `prefers-reduced-motion: no-preference` (com redução, o carimbo aparece direto).
- ADR 0025 (mesa de votação: apresentação, som, o que não muda nas regras).

## Etapa 3 — Seja deputado

- Um ofício "urgente" na mesa; carimbos SIM e NÃO ao lado (embaixo no celular).
- Depois do voto: marca de tinta no ofício; o painel do plenário acende com o placar **oficial** (Sim, Não, outros; assentos restantes até 513 como "sem voto registrado"), em tinta cheia / hachurado / vazado — nunca verde × vermelho; depois o carimbo APROVADA/REJEITADA. "Quem votou o quê" e orientações continuam embaixo, como hoje.

## Etapa 4 — Vote você também

- Pilha com os 10 documentos da semana (contador e bordas de papéis empilhados). Carimbar SIM/NÃO ou "Separar para depois".
- Bandeja "Para depois" com os separados; ao fim da pilha, voltar a eles ou encerrar com eles em branco.
- "Relatório final" em papel timbrado com as concordâncias (o mesmo cálculo de hoje).
- Armazenamento: o formato atual continua válido; entra um campo opcional `later` (ids separados). Quem já jogou a semana não perde nada.

## Etapa 5 — Placar

- Ofício da votação + "boletim" (formulário de papel) com o palpite: maioria do estado (Sim / Não / Empate) e porcentagem de Sim (o controle deslizante vira uma régua).
- Revelação: o boletim recebe a marca "conferido" e o resultado oficial ao lado, campo a campo; carimbo oficial. Pontuação igual à de hoje.

## Etapa 6 — Dle do seu estado

- "Investigação de arquivo": ficha secreta (pasta fechada) no topo; cada chute vira uma ficha de deputado ao lado, com as pistas marcadas como abas de fichário (mesmas cores, símbolos e textos de hoje).
- Revelação: a pasta abre com a foto (meio-tom) e o link para a ficha.

## Etapa 7 — Fechamento

- `pnpm check:a11y` e `pnpm check:a11y:jogos` sem violações (ajustar o script se o estado "jogado" mudar).
- Capturas 390 px e desktop, claro e noturno, sem rolagem lateral.
- Peso depois, comparado com o de antes.
- `docs/DESIGN.md` (seção "Mesa de votação"), CLAUDE.md (ADRs novos), relatório `docs/RELATORIO-JOGOS-V2.md`.
- `pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build`.

## Limites

- Nada de Papers, Please (ou outro jogo): sem pixel art, personagens, brasões, nomes ou frases. Tudo papel, tinta e carimbo do Extrapolar.
- Neutralidade: o carimbo registra a escolha do jogador; nenhuma cor ou som diferente para Sim e Não; a revelação só mostra o que aconteceu.
- `@extrapolar/games` não muda. Se alguma regra precisar mudar, ADR.
- Nada inventado nos documentos: número da proposição, data, ementa ou resumo revisado, placar e votos vêm dos JSON gerados. O "número do ofício" é o número da proposição (não inventamos numeração).
