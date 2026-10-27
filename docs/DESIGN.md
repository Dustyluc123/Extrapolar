# Design

## Direção

Um **jornal impresso antigo**, mas limpo, moderno e feito para o celular primeiro. Papel e tinta, uma única cor forte usada como marca-texto, títulos com cara de manchete. Nada de estética de dashboard (cards cinza, gradientes roxos, ícones em todo lugar).

Público: jovens que não acompanham política. Textos curtos e diretos; números grandes tratados como manchete; contexto sempre ao lado do número.

## Tokens

Definidos em `apps/web/src/styles/tokens.css` como variáveis CSS e expostos ao Tailwind 4 via `@theme`. Nunca usar cor solta no componente: sempre o token.

### Cores — edição do dia (claro)

| Token                   | Valor     | Uso                                                              | Contraste                                       |
| ----------------------- | --------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| `--color-paper`         | `#F4EFE3` | Fundo (papel envelhecido)                                        | —                                               |
| `--color-card`          | `#ECE5D4` | Fundo de cartões e blocos                                        | —                                               |
| `--color-ink`           | `#1B1A17` | Texto principal                                                  | 15,2:1 no papel                                 |
| `--color-ink-soft`      | `#57524A` | Texto secundário, legendas                                       | 6,8:1 no papel; 6,2:1 no cartão                 |
| `--color-rule`          | `#8C8473` | Réguas e bordas                                                  | 3,2:1 (elemento de interface)                   |
| `--color-accent`        | `#E4432A` | Vermelho-tomate: marca-texto, números grandes, detalhes gráficos | 3,6:1, **só texto grande (≥ 24 px) ou gráfico** |
| `--color-accent-ink`    | `#B5321C` | Vermelho para texto pequeno (links, rótulos)                     | 5,3:1 no papel; 4,9:1 no cartão                 |
| `--color-marker`        | `#FFB8A6` | Fundo de destaque tipo marca-texto, sempre com texto `ink`       | 10,5:1                                          |
| `--color-on-accent`     | `#F4EFE3` | Texto sobre botão vermelho (`accent-strong`)                     | —                                               |
| `--color-accent-strong` | `#C4361E` | Fundo de botão ativo                                             | ≥ 4,5:1 com `on-accent`                         |

### Cores — edição noturna (escuro)

| Token                                   | Valor                             | Contraste                                   |
| --------------------------------------- | --------------------------------- | ------------------------------------------- |
| `--color-paper`                         | `#161512`                         | —                                           |
| `--color-card`                          | `#22201B`                         | —                                           |
| `--color-ink`                           | `#EEE7D7`                         | 14,8:1                                      |
| `--color-ink-soft`                      | `#B5AD9B`                         | 8,2:1 no papel; 7,3:1 no cartão             |
| `--color-rule`                          | `#6E6759`                         | 3,3:1                                       |
| `--color-accent` / `--color-accent-ink` | `#FF6B4F`                         | 6,5:1 no papel; 5,8:1 no cartão             |
| `--color-marker`                        | `#9A3A28` (com texto `ink` claro) | 5,7:1 com o texto; sem texto, só decorativo |

Contrastes calculados com a fórmula do WCAG 2.x. Qualquer cor nova precisa passar AA (4,5:1 para texto normal, 3:1 para texto grande e elementos de interface).

A edição noturna segue `prefers-color-scheme` e pode ser escolhida no botão do cabeçalho ("Edição do dia" / "Edição noturna"); a escolha fica no `localStorage` (`extrapolar:edicao`) e é aplicada antes da primeira pintura para não piscar.

### Neutralidade nas cores

- O vermelho é a cor do **site**, não de partido. Selos de partido e de estado são sempre neutros (tinta sobre papel, borda fina). Nunca usar cor de partido.
- O vermelho não indica "ruim" nem "bom". Números da métrica usam a mesma cor para todos os deputados.

### Tipografia

| Papel                                    | Fonte                                                                                                                                     | Pacote                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Manchetes, nome do site, números grandes | **Fraunces** (variável, eixos `opsz`, `wght`, `SOFT`, `WONK`)                                                                             | `@fontsource-variable/fraunces`   |
| Texto corrido, legendas                  | **Newsreader** (variável, `opsz`)                                                                                                         | `@fontsource-variable/newsreader` |
| Rótulos, selos, dados em tabela          | Pilha de sistema sans (`ui-sans-serif, system-ui, …`) em caixa-alta pequena com espaçamento (`tracking-[0.12em]`, `text-xs`, `uppercase`) | —                                 |

Fontes servidas pelo próprio site (sem Google Fonts em tempo de execução), em `font-display: swap`.

Escala (mobile → desktop): manchete principal 2.5rem → 4.5rem; título de seção 1.5rem → 2rem; número-manchete 4rem → 6rem; texto 1.0625rem; legenda 0.875rem itálico.

### Espaço, réguas e cantos

- Grid de 4 px. Margem lateral no celular: 16 px.
- **Réguas:** `1px solid var(--color-rule)` entre seções; régua dupla (`3px double`) abaixo do masthead.
- **Cantos:** cartões `0.5rem`; selos totalmente arredondados (`9999px`).
- Desktop: grid de colunas (2 colunas na ficha, 3 na lista de deputados a partir de `lg`), com réguas verticais finas entre colunas.

## Elementos de jornal

- **Masthead:** nome "Extrapolar" em Fraunces bem grande e condensada; linha fina com "Edição de quarta-feira, 21 de outubro de 2026" (data da **última atualização dos dados**, não do build) e a legislatura.
- **Manchete** (`components/ui/Headline.astro`): título em Fraunces com `opsz` alto.
- **Régua** (`components/ui/Rule.astro`): simples ou dupla.
- **Selo** (`components/ui/Badge.astro`): etiqueta arredondada para partido e UF.
- **Número-manchete** (`components/ui/BigNumber.astro`): número enorme, legenda em itálico abaixo, e linha "Fonte · atualizado em · como calculamos".
- **Marca-texto** (`.marker`): fundo `--color-marker` inclinado levemente, como caneta.
- **Legendas** em itálico (Newsreader).

## Fotos

Tratamento de foto de jornal **só em CSS**, sem alterar o arquivo original:

- `filter: grayscale(1) contrast(1.15)`;
- retícula (meio-tom) por cima, com `radial-gradient` repetido e `mix-blend-mode: multiply` (no escuro, `screen` com opacidade menor);
- `alt` sempre com o nome do deputado; crédito "Foto: Câmara dos Deputados".
- Ao passar o mouse ou focar no cartão, a retícula some suavemente (microinteração).

## Imagens de prévia (compartilhar)

Geradas no build (ADR 0023, `apps/web/src/lib/og/cards.tsx`), 1200 × 630, sempre na edição do dia: masthead "Extrapolar" com régua dupla, chapéu em vermelho, manchete em Fraunces, traço de caneta, subtítulo em Newsreader itálico, carimbo vermelho girado no canto e rodapé com a fonte (e o domínio). Na ficha: foto em meio-tom de verdade (pontos de tinta), nome, selos de partido e UF, nome do estado e a chamada "Veja o que fez na Câmara" em marca-texto. **Sem números nem métricas**, e sem gênero na chamada. Para ver: `pnpm dev` e abrir `/og/extrapolar.png` ou `/og/deputados/<id>.png`.

## Microinterações

- Transições curtas (150–200 ms), só em `transform`, `opacity` e cor.
- Respeitar `prefers-reduced-motion: reduce` (sem animação).

## Acessibilidade

- Contraste AA no mínimo (tabela acima).
- Navegação por teclado com foco visível (`outline` de 2 px na cor `accent-ink`, com `outline-offset`).
- Link "Pular para o conteúdo" no topo.
- Busca e filtros com `<label>` e anúncio do número de resultados em `aria-live="polite"`.
- Textos alternativos em todas as imagens; ícones decorativos com `aria-hidden`.
- `lang="pt-BR"` em todas as páginas.

## Fase 1 — um pouco menos sério

A estética de jornal antigo continua; o humor fica **na moldura e nos textos de apoio**, nunca sobre deputados, partidos ou posições políticas, e nunca nos números e explicações.

### Elementos

- **Carimbo** (`.stamp`): etiqueta em caixa-alta com borda vermelha, girada −4°. Usado em "Dado oficial" (resumo da ficha), "Sem juridiquês" (glossário) e "Erro 404".
- **Recorte** (`.clipping`, `.tilt-l`, `.tilt-r`): cartão de papel com sombra curta e rotação de ±0,6°, que se endireita ao passar o mouse ou focar. Usado no resumo em números, nos anúncios do glossário e na página 404.
- **Traço de caneta** (`.scribble`): sublinhado "feito à mão" em vermelho-tomate nos títulos dos cadernos.
- **"Traduzindo:"** (`.translate-note`): bilhete em marca-texto, levemente torto, com a ideia da métrica numa frase de conversa ("bateu o ponto nas sessões em que se vota?"). Sem pronome de gênero (as frases valem para deputados e deputadas).
- **Seções de jornal:** a ficha é dividida em **cadernos** numerados; o glossário é a página de **Classificados**; a página "Sobre" tem uma **Errata**; a 404 diz "Essa notícia não saiu nesta edição".
- **Estados vazios simpáticos:** todo "Sem dado" vem com "Regra da casa: sem fonte oficial, sem número. A gente não inventa."

### Microinterações

- Barras e colunas **crescem** e números-manchete **sobem** ao entrar na tela, com animação ligada à rolagem (`animation-timeline: view()`), **sem JavaScript**. Onde o navegador não suporta, aparecem prontos. O ponto de partida nunca é invisível (opacidade 0,35; barras a 15%), para nenhum número sumir se algo falhar.
- Tudo desligado com `prefers-reduced-motion: reduce`. Os scripts de capturas e de acessibilidade emulam essa preferência, para ver e auditar o estado final.

### Gráficos (ADR 0013)

- Infográfico de jornal: tinta sobre papel; vermelho-tomate só para destacar o valor principal (a primeira barra, o tipo mais frequente) — nunca para indicar "bom" ou "ruim".
- Rótulos diretos ao lado das barras, valores em pt-BR (`R$ 1,2 mi`), tabela com os mesmos dados em "Ver os dados em tabela".
- Colunas em SVG com posições em %; barras e linhas do tempo em HTML/CSS (rótulos longos quebram linha no celular).

## Fase 2 — Jogos e ranking

Estilos em `apps/web/src/styles/games.css`, importado só nessas páginas.

- **Peças do Dle:** verde (`--color-hit`), amarelo (`--color-near`) e vermelho (`--color-miss`), sempre com símbolo (✓ ≈ ✗, ↑ ↓) e texto para leitor de tela. As cores falam do **chute**, nunca do deputado. Contraste: texto pequeno ≥ 4,5:1 nos dois temas (vermelho das peças no claro escurecido para `#b5321c`, 5,3:1, depois da auditoria do axe com o jogo terminado).
- **Revelação:** faixa "Edição extra" (régua dupla + caixa-alta espaçada) e **carimbo grande** APROVADA/REJEITADA (`.stamp-big`, mesma cor para os dois resultados), que "bate" na tela (`.stamp-in`) só com `prefers-reduced-motion: no-preference`.
- **Placar:** barra Sim (tinta) × Não (hachurado), com os números escritos; controle deslizante grande para o polegar.
- **Ranking:** aviso permanente em caixa com borda no topo; barra empilhada da nota em tons de tinta e hachura (só distinguem as métricas, não avaliam); "maior sobe" / "menor sobe" em vez de "mais é melhor".
- **Quadradinhos de compartilhar** sem a resposta (🟩🟨🟥 no Dle, barra ▰▱ no Placar).
- Botões: `.game-button` (pílula vermelha) e `.choice` (escolha marcada com tinta cheia, `aria-pressed` ou `aria-checked`).

## Mesa de votação (jogos)

ADR 0025. Os jogos passam a sensação de **estar votando**: uma mesa com documentos que a pessoa lê, decide e carimba. A inspiração é só a sensação dos jogos de mesa burocrática; nada de pixel art, personagens, brasões, nomes ou frases de nenhum jogo. Os materiais são os do jornal: papel, tinta, carimbo, clipe, régua. Estilos em `apps/web/src/styles/desk.css`; peças em `apps/web/src/components/games/desk/`.

### Peças

- **Mesa** (`Desk`): mata-borrão verde-escuro (feltro em CSS, ruído SVG muito leve e vinheta), com régua tracejada no alto, rótulo "Mesa de votação · …" e o botão **Som**. No celular ocupa a largura da tela (sem margem lateral e sem rolagem lateral, `overflow-x: clip`); a partir de 640 px vira um tampo com borda; a partir de 900 px, papéis à esquerda e carimbos e crachá numa coluna à direita.
- **Ofício** (`Oficio`): papel timbrado **do Extrapolar** ("Mesa de votação · documento de jogo com dados oficiais"), régua dupla, campos "Sessão" e "Em votação", a proposição como título, o assunto (resumo revisado ou ementa oficial) e o campo "Para deliberação do(a) parlamentar" com o espaço do carimbo. Etiqueta de pasta (marca-texto) e clipe. Não imita papel oficial da Câmara; não usamos "urgente" (é termo real do regimento: "regime de urgência").
- **Carimbos** (`StampPad`): SIM e NÃO com cabo de madeira e face de borracha; botões comuns (toque, clique, teclado), o mesmo desenho, a mesma cor e o mesmo som para os dois.
- **Marca de tinta** (`InkMark`): borda dupla em `accent-ink`, falhas de tinta por máscara de ruído, torta entre 2° e 8° e um pouco fora do centro — fixa para cada documento (`lib/games/tilt.ts`).
- **Painel do plenário** (`PlenaryPanel`, Seja deputado): quadro escuro com 513 luzes do placar oficial: Sim cheia, Não hachurada, outros votos vazados, assentos restantes apagados ("sem voto registrado"). Legenda com os números escritos. Nunca verde × vermelho.
- **Boletim** (Placar): papel pautado com margem vermelha, quadradinhos de marcar (✕ em tinta vermelha) e régua sob o controle deslizante. Na revelação, tabela "Seu boletim × resultado oficial" e a marca "Conferido".
- **Pilha e bandeja** (Vote você também): folhas por baixo da de cima conforme o que falta; bandeja tracejada "Para depois" com os separados; relatório final em papel timbrado.
- **Pasta e fichas** (Dle): pasta de arquivo cor de papel pardo (`--color-folder`) com as pistas já confirmadas; cada chute é uma ficha com linha vermelha e as pistas como abas de fichário (mesmas cores e símbolos de antes). A pasta abre com a foto em meio-tom.
- **Crachá** (`Badge`): cartão com faixa vermelha e furo, "Parlamentar por um dia", estatísticas e sequência deste aparelho.

### Tokens novos

| Token                                   | Claro                 | Noturno   | Contraste                                                                         |
| --------------------------------------- | --------------------- | --------- | --------------------------------------------------------------------------------- |
| `--color-desk`                          | `#2B3A31`             | `#101712` | —                                                                                 |
| `--color-on-desk`                       | `#ECE5D4`             | `#D9D1BF` | 9,5:1 / 12,0:1 na mesa                                                            |
| `--color-on-desk-soft`                  | `#B9B2A0`             | `#A39B89` | 5,7:1 / 6,6:1 na mesa                                                             |
| `--color-sheet`                         | `#FBF8EF`             | `#24221D` | tinta 16,4:1 / 12,9:1; `ink-soft` 7,3:1 / 7,1:1; `accent-ink` 5,8:1 / 5,7:1       |
| `--color-sheet-edge`                    | `#C9C0AC`             | `#4A463D` | borda decorativa                                                                  |
| `--color-folder`                        | `#E8D9B0`             | `#3A3426` | tinta 12,4:1 / 10,0:1; `ink-soft` 5,5:1 / 5,5:1. **Sem** vermelho pequeno (4,4:1) |
| `--color-board` / `--color-board-light` | `#1B1A17` / `#F4EFE3` | iguais    | 15,2:1                                                                            |
| `--color-wood` / `--color-wood-dark`    | `#6B4A32` / `#3F2A1C` | iguais    | só desenho (cabo do carimbo)                                                      |

Foco sobre a mesa usa `on-desk` (o vermelho do foco não aparece no feltro); dentro dos papéis volta a `accent-ink`.

### Movimento e som

- Carimbo: a marca "bate" (escala 1,6 → 1, 260 ms). Papel novo chega por cima, vindo do alto e girado (420 ms). Luzes do painel acendem em ondas de 32 (45 ms cada). Carimbo oficial depois do painel. Tudo dentro de `prefers-reduced-motion: no-preference`; com redução, aparece pronto.
- Depois do carimbo, o foco vai para o título do resultado e um `aria-live` anuncia o voto e o resultado oficial.
- Som (`lib/games/sound.ts`, Web Audio, sem arquivos): baque do carimbo, papel deslizando, estalinhos do painel, carimbo oficial. **Desligado por padrão**; botão "Som" sempre visível na mesa; escolha em `localStorage` (`extrapolar:jogos:som`); nunca com a aba escondida.
