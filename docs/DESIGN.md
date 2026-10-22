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

| Token                                   | Valor                         | Contraste                       |
| --------------------------------------- | ----------------------------- | ------------------------------- |
| `--color-paper`                         | `#161512`                     | —                               |
| `--color-card`                          | `#22201B`                     | —                               |
| `--color-ink`                           | `#EEE7D7`                     | 14,8:1                          |
| `--color-ink-soft`                      | `#B5AD9B`                     | 8,2:1 no papel; 7,3:1 no cartão |
| `--color-rule`                          | `#6E6759`                     | 3,3:1                           |
| `--color-accent` / `--color-accent-ink` | `#FF6B4F`                     | 6,5:1 no papel; 5,8:1 no cartão |
| `--color-marker`                        | `#FF9A85` (com texto `paper`) | 8,9:1                           |

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
