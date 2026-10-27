# 0025 — Jogos como "mesa de votação" (apresentação e som)

**Status:** aceito (27/10/2026) — briefing "Analytics + jogos com cara de mesa de votação"; mesa, som, "separar para depois" e painel do plenário decididos pelo Lucas no planejamento

## Contexto

Os jogos funcionavam, mas pareciam um formulário: um cartão com a votação e dois botões. O pedido é que passem a sensação de estar votando — uma mesa com documentos que a pessoa lê, decide e carimba —, inspirada só na **sensação** dos jogos de mesa burocrática, sem copiar nada de nenhum jogo, e sem mexer nas regras nem na neutralidade.

## Decisão

- **Só apresentação.** `@extrapolar/games` não muda: sorteio, pontuação, concordância e textos de compartilhar continuam os mesmos. Os dados dos documentos são os gerados pelo pipeline (proposição, data, ementa ou resumo revisado, placar, votos); o "número do documento" é o da própria proposição.
- **Mesa de mata-borrão** (feltro verde-escuro em CSS, sem imagem) com papéis por cima. No celular, a mesa ocupa a largura da tela; no computador, papéis à esquerda, carimbos e crachá à direita. Componentes em `apps/web/src/components/games/desk/`, estilos em `styles/desk.css` (só nas páginas dos jogos).
- **Ofício em papel timbrado do Extrapolar**, com a frase "documento de jogo com dados oficiais": não imita papel, brasão ou timbre da Câmara.
- **Carimbos SIM e NÃO** são botões comuns (toque, clique, teclado). Mesmo desenho, mesma cor e mesmo som para os dois. A marca no papel é torta como carimbo de verdade, mas a inclinação é fixa para cada votação (hash do id, `lib/games/tilt.ts`), para não mudar a cada visita.
- **Sem "urgente":** "regime de urgência" é um termo real da Câmara; o ofício do Seja deputado usa a etiqueta "Votação mais recente".
- **Painel do plenário** (Seja deputado): 513 luzes com o placar **oficial** — Sim em tinta cheia, Não hachurado, outros votos vazados, e os assentos restantes como "sem voto registrado". Nunca verde × vermelho.
- **Som opcional** (`lib/games/sound.ts`), gerado com Web Audio, sem arquivos (padrão do Chutaí): carimbo, papel, painel. **Desligado por padrão**, botão "Som" sempre visível na mesa, escolha em `localStorage` (`extrapolar:jogos:som`). Não toca com a aba escondida.
- **Movimento:** animações curtas em CSS, só com `prefers-reduced-motion: no-preference`; com redução, o carimbo e os papéis aparecem prontos.
- **Vote você também:** "Pular" virou "Separar para depois". Os separados voltam antes do relatório final; encerrar com eles em branco equivale ao "pular" de antes (não entram na conta). O progresso guardado ganhou o campo opcional `later`; o formato antigo continua válido.

## Alternativas descartadas

- **Arrastar o carimbo até o papel:** mais "real", mas ruim no teclado e no leitor de tela; o briefing pede botões.
- **Biblioteca de animação** (Framer Motion e afins): dezenas de KB para efeitos que o CSS faz.
- **Fundo de madeira:** mais pesado visualmente e mais difícil de manter o contraste nos dois temas.

## Consequências

- As páginas dos jogos ganham alguns KB de CSS e JS (medidos no `docs/RELATORIO-JOGOS-V2.md`).
- Os scripts de acessibilidade e de capturas continuam valendo; o `check:a11y:jogos` foi ajustado aos novos botões.
