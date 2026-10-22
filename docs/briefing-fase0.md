# Briefing — Fase 0 do Extrapolar

> Briefing original que deu início ao projeto, mantido como registro histórico.
> As decisões tomadas a partir dele estão em `docs/decisoes/` e no `CLAUDE.md`.

---

Você vai começar comigo um projeto do zero. O repositório tem só um README. Antes de escrever qualquer código, leia este briefing inteiro, me apresente um plano de execução em etapas e espere minha aprovação.

## 1. O que é o projeto

**Extrapolar** é um site brasileiro que mostra, de forma simples e neutra, o que os deputados federais estão fazendo na Câmara. O público principal são jovens que **não** acompanham política. Os concorrentes (Ranking dos Políticos, Radar do Congresso, FiscalizaJá) falam com quem já se interessa; nós queremos falar com quem não se interessa.

Visão de longo prazo (NÃO implementar agora, só deixar a arquitetura preparada):
- Classificações por métrica (presença, gastos, proposições), cada uma com explicação do que mede e do que não mede.
- "Monte seu ranking": o usuário escolhe os pesos; o site nunca define um ranking oficial.
- "Quem é meu deputado?" por estado.
- "Vote você também": o usuário vota nos mesmos projetos que a Câmara votou e vê quais deputados votam parecido com ele.
- Resumo semanal do que foi votado, gerado com IA a partir do texto oficial e revisado por humano.
- Minigames diários: quiz sobre proposições e um "dle" de deputados.

## 2. Princípios inegociáveis

Coloque estes princípios no `CLAUDE.md` e siga-os em todo o código e texto:

1. **Neutralidade.** O site mostra números e fatos, nunca julgamentos. Proibido usar palavras como "melhor", "pior", "corrupto", "vergonha", "herói" em textos, nomes de variáveis visíveis, títulos ou componentes. Mostramos o dado e explicamos o contexto; quem conclui é o leitor.
2. **Todo número é verificável.** Cada métrica exibida tem a fonte oficial, a data da última atualização e um link para a metodologia.
3. **Nunca invente dados.** Se um valor não vier de uma fonte oficial (por exemplo, o teto da cota parlamentar por estado), crie o arquivo de configuração com a estrutura, deixe os valores como `null` com um comentário `// TODO: conferir na fonte oficial: <link>` e me avise. Nunca preencha números de memória.
4. **Custo perto de zero.** Sem servidor rodando 24 horas. O site é estático (ou quase), os dados são atualizados por tarefas agendadas.
5. **Contexto das métricas.** Toda métrica tem limitações documentadas. Exemplo: deputado licenciado para ser ministro aparece com baixa participação; a cota parlamentar tem teto diferente por estado.

## 3. Stack

- **TypeScript** em tudo.
- **Monorepo** com pnpm workspaces + Turborepo (mesmo padrão do meu projeto anterior, o Chutaí).
- **Site: Astro**, com ilhas React só onde houver interação (no futuro, os jogos e o "monte seu ranking"). O site é quase todo conteúdo, então HTML estático por padrão é mais rápido e mais barato.
- **Estilo: Tailwind CSS 4** com tokens de design próprios.
- **Validação: Zod** para validar tudo o que vem da API da Câmara antes de entrar no projeto.
- **Testes: Vitest.** Qualidade: ESLint, Prettier, GitHub Actions.
- **Hospedagem: Vercel** (site estático) + **GitHub Actions** (pipeline de dados agendado).
- **Sem banco de dados na Fase 0.** O pipeline gera arquivos JSON que o Astro lê no build. Deixe a estrutura preparada para adicionar PostgreSQL depois (interface de repositório, como no Chutaí), mas não implemente.

Se você discordar de alguma escolha, me diga o motivo antes de começar, não troque por conta própria.

## 4. Estrutura de pastas

Proposta inicial (pode sugerir ajustes no plano):

```
Extrapolar/
├── apps/
│   └── web/                      # Site em Astro
│       ├── src/
│       │   ├── pages/            # index, deputados/[id], metodologia, sobre
│       │   ├── components/
│       │   │   ├── ui/           # Elementos base do "jornal": manchete, coluna, régua, selo
│       │   │   ├── deputado/     # Cartão, ficha, gráficos do deputado
│       │   │   └── layout/       # Cabeçalho (masthead), rodapé
│       │   ├── lib/              # Leitura dos dados gerados, formatação (datas, R$)
│       │   └── styles/           # Tokens, fontes, texturas
│       └── public/
├── packages/
│   ├── pipeline/                 # Baixa, valida, normaliza e calcula. Roda no GitHub Actions
│   │   ├── src/
│   │   │   ├── sources/          # Um arquivo por fonte (camara-api.ts, camara-arquivos.ts)
│   │   │   ├── steps/            # fetch → normalize → compute → publish
│   │   │   └── index.ts
│   │   └── tests/
│   ├── metrics/                  # Funções puras que calculam cada indicador (sem rede, sem disco)
│   │   ├── src/
│   │   └── tests/
│   └── shared/                   # Tipos, esquemas Zod, constantes (legislatura atual, etc.)
├── data/
│   ├── raw/                      # Cache dos downloads (no .gitignore)
│   └── generated/                # JSON final consumido pelo site
├── docs/
│   ├── ARQUITETURA.md
│   ├── METODOLOGIA.md            # Como cada métrica é calculada e suas limitações
│   ├── DESIGN.md                 # Direção visual e tokens
│   ├── FONTES.md                 # Cada fonte de dados com link e licença
│   └── decisoes/                 # ADRs curtos: 0001-astro.md, 0002-sem-banco-na-fase-0.md...
├── .github/workflows/
│   ├── ci.yml                    # Lint, tipos, testes e build a cada push
│   └── pipeline.yml              # Atualização diária dos dados (cron) + disparo manual
├── CLAUDE.md
└── README.md
```

A separação entre `metrics` (cálculo puro e testável) e `pipeline` (rede, disco, orquestração) é importante: é o mesmo princípio do `packages/game` no Chutaí.

## 5. Dados da Câmara: regras

- Documentação da API: https://dadosabertos.camara.leg.br/swagger/api.html
- A Câmara recomenda usar os **arquivos estáticos** (atualizados diariamente) para cargas grandes, e limita requisições por segundo na API. Prefira os arquivos sempre que existirem; quando precisar da API, use pausa entre requisições, poucas requisições simultâneas e novas tentativas com espera crescente.
- A API é instável. O site **nunca** chama a API da Câmara diretamente; ele só lê o JSON gerado pelo pipeline.
- Guarde os downloads em `data/raw/` como cache, para não baixar tudo de novo a cada execução.
- Valide tudo com Zod. Se um campo vier diferente do esperado, o pipeline deve falhar com uma mensagem clara, não publicar dado quebrado.
- **A legislatura deve ser configurável** (em `packages/shared`). A 57ª legislatura termina em 31/01/2027 e a 58ª começa em 01/02/2027; trocar de legislatura deve ser mudar uma constante.
- Para participação em votações, use só **votações nominais de plenário** (as únicas em que o voto individual fica registrado). Documente isso na metodologia.

## 6. Escopo desta fase (Fase 0)

Faça só isto:

1. Estrutura do monorepo, configs (TypeScript, ESLint, Prettier, Turborepo), CI.
2. `CLAUDE.md` e a pasta `docs/` com os documentos acima (ARQUITETURA, METODOLOGIA, DESIGN, FONTES e os primeiros ADRs).
3. Pipeline que baixa a **lista de deputados em exercício** e os dados básicos de cada um (nome, partido, estado, foto oficial, situação), valida e gera `data/generated/deputados.json`.
4. Primeira métrica: **participação em votações nominais de plenário** na legislatura atual, calculada em `packages/metrics` com testes, gerada pelo pipeline.
5. Site com:
   - Página inicial em formato de capa de jornal: lista de deputados com busca e filtro por estado e partido.
   - Página de cada deputado (`/deputados/[id]`) com dados básicos e a métrica de participação, com fonte, data e link para a metodologia.
   - Página de metodologia gerada a partir de `docs/METODOLOGIA.md`.
6. Workflow `pipeline.yml` agendado diariamente que roda o pipeline e dispara um novo deploy na Vercel (via deploy hook guardado em secret).

**Não faça nesta fase:** jogos, "monte seu ranking", resumos com IA, gastos da cota, login, banco de dados.

## 7. Direção visual

A identidade deve lembrar um **jornal impresso antigo**, mas ser **limpa, moderna e atraente para jovens**, no celular primeiro. Referência de limpeza: o Chutaí. Documente tudo em `docs/DESIGN.md` e em tokens no CSS.

- **Papel e tinta:** fundo cor de papel envelhecido (off-white levemente amarelado), texto quase preto como tinta. Uma única cor de destaque forte, moderna (algo vibrante, como um vermelho-tomate ou azul elétrico), usada com moderação, como um marca-texto.
- **Tipografia:** títulos numa serifada de alto contraste, com cara de manchete (sugestões: Fraunces, Playfair Display ou Newsreader, via fontes variáveis). Texto corrido numa serifada legível ou numa sans limpa. Rótulos em versalete ou caixa-alta pequena com espaçamento.
- **Elementos de jornal:** cabeçalho no estilo "masthead" com o nome do site e a data da edição ("Edição de quarta-feira, 21 de outubro de 2026"), réguas finas separando seções, grid de colunas no desktop, números grandes tratados como manchete, legendas em itálico.
- **Toque jovem:** microinterações suaves, destaques que parecem marca-texto, selos e etiquetas arredondadas para estado e partido, cantos levemente arredondados nos cartões, textos curtos e diretos.
- **Fotos dos deputados:** tratamento em meio-tom (halftone) ou escala de cinza com contraste, para parecer foto de jornal. Faça isso no build ou em CSS, nunca alterando o arquivo original. Registre em `docs/FONTES.md` a origem das fotos e verifique as condições de uso.
- **Modo escuro** opcional, tratado como "edição noturna" (papel escuro, tinta clara).
- **Acessibilidade:** contraste AA no mínimo, navegação por teclado, textos alternativos.
- Evite a estética genérica de dashboard (cards cinza, gradientes roxos, ícones em todo lugar).

## 8. Como trabalhar comigo

- Comece pelo **plano**, em etapas pequenas, cada uma terminando em algo que funciona. Espere minha aprovação.
- Faça commits pequenos e descritivos, em português, ao fim de cada etapa.
- Escreva testes para tudo que está em `packages/metrics` e para a validação dos dados.
- Quando tomar uma decisão de arquitetura relevante, registre um ADR curto em `docs/decisoes/`.
- Se algo neste briefing estiver ambíguo ou parecer errado, pergunte antes de seguir.
- Toda a interface e a documentação em português do Brasil. Nomes de código podem ficar em inglês ou português, mas seja consistente e registre a escolha no `CLAUDE.md`.

## 9. Critério de pronto da Fase 0

- `pnpm install && pnpm dev` sobe o site localmente com dados reais.
- `pnpm pipeline` gera os JSON a partir da Câmara (usando o cache quando existir).
- `pnpm test`, `pnpm lint` e `pnpm typecheck` passam, e o CI roda tudo a cada push.
- Página inicial e página de deputado funcionando no celular, com a identidade visual aplicada.
- `CLAUDE.md` e `docs/` completos o suficiente para uma nova sessão do Claude Code entender o projeto sem este briefing.
