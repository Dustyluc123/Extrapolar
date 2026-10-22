<h1 align="center">Extrapolar</h1>

<p align="center">
  <strong>O que os deputados federais estão fazendo, em números e fatos.</strong><br />
  Dados oficiais da Câmara e da CGU, explicados em poucas linhas, para quem não acompanha política. Sem ranking e sem adjetivo.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" />
  <img alt="Astro" src="https://img.shields.io/badge/Astro-6-bc52ee?logo=astro&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white" />
  <img alt="Zod" src="https://img.shields.io/badge/Zod-4-3e67b1?logo=zod&logoColor=white" />
  <a href="https://github.com/Dustyluc123/Extrapolar/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Dustyluc123/Extrapolar/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Testes" src="https://img.shields.io/badge/testes-144_passando-12a85f" />
</p>

<p align="center">
  <img src="docs/imagens/capa-desktop.jpg" alt="Capa do Extrapolar no estilo de jornal: nome do site, data da edição, manchete com o número de deputados em exercício e o total de votações nominais no plenário" width="900" />
</p>

---

## Índice

- [O que é](#o-que-é)
- [Princípios](#princípios)
- [Funcionalidades](#funcionalidades)
- [Telas](#telas)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar](#como-rodar)
- [Dados e metodologia](#dados-e-metodologia)
- [Testes e verificações](#testes-e-verificações)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Sobre mim](#sobre-mim)

## O que é

Sites como Ranking dos Políticos, Radar do Congresso e FiscalizaJá falam com quem já se interessa por política. O **Extrapolar** quer falar com quem **não** se interessa: jovens que nunca abriram o site da Câmara, mas querem entender em poucos minutos o que o deputado do seu estado anda fazendo.

O visual lembra um **jornal impresso antigo** (papel, tinta, manchetes, réguas), mas é limpo, moderno e feito primeiro para o celular. Cada número aparece grande, como manchete, sempre acompanhado de fonte, data de atualização e explicação do que ele mede e do que **não** mede.

## Princípios

1. **Neutralidade.** Números e fatos, nunca julgamentos. Nada de "melhor", "pior", "corrupto", "herói". Quem conclui é o leitor.
2. **Todo número é verificável.** Fonte oficial, data da última atualização e link para a metodologia ao lado de cada indicador.
3. **Nunca inventar dados.** O que não vem de fonte oficial fica como "sem dado" (`null`), nunca como zero.
4. **Custo perto de zero.** Site estático, sem servidor ligado; os dados são atualizados por uma tarefa agendada.
5. **Contexto.** Toda métrica documenta suas limitações.

O site **nunca define um ranking**: a lista de deputados é sempre em ordem alfabética.

## Funcionalidades

- [x] Capa com os **513 deputados em exercício**, busca por nome (ignora acentos) e filtros por estado e partido, com o filtro salvo na URL para compartilhar
- [x] Ficha de cada deputado (`/deputados/[id]`) com **resumo em números** (6 números fixos, os mesmos para todos) e **7 cadernos**, como um jornal:
  - **Plenário:** participação em votações nominais, presença em sessões deliberativas, alinhamento com a orientação do partido e do Governo
  - **Comissões:** comissões e cargos (linha do tempo), presença nas reuniões em que é titular, audiências e eventos realizados a pedido
  - **Projetos e leis:** projetos por tipo (autor principal × coautoria), o que aconteceu com eles (taxa de conversão em norma), temas oficiais, pareceres como relator
  - **Fiscalização:** requerimentos de informação, propostas de fiscalização, convocações de ministros (tipo oficial) e indicações ("sugestões ao governo")
  - **Voz:** discursos por ano e por fase da sessão (atualização semanal)
  - **Dinheiro público:** cota parlamentar (por mês, categoria e, onde há tabela oficial, em relação ao teto), equipe do gabinete e emendas individuais (CGU)
  - **Articulação e perfil:** frentes parlamentares, cargos (Mesa, comissões, lideranças), profissões e ocupações declaradas
- [x] Toda métrica com número, gráfico, **"Traduzindo:"**, **"O que é isso?"**, **"O que este número não mostra"**, fonte, data e link para a metodologia
- [x] **"Sem dado" com motivo**, nunca zero no lugar de dado ausente
- [x] Gráficos gerados no build (SVG e HTML), sem JavaScript, com tabela dos mesmos dados
- [x] **Glossário** (`/glossario`) com 42 termos, no estilo "Classificados", linkado a partir das fichas
- [x] Página de **metodologia** gerada a partir de [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md), com o que ficou de fora e por quê
- [x] Cabeçalho de jornal com a **data da edição**, **edição noturna** (modo escuro), fotos em **meio-tom** só em CSS
- [x] Valores brutos de todas as métricas guardados (`metricas.json`) para o futuro "monte seu ranking" — sem ranking, média ou comparação no site
- [x] Acessível: contraste AA nos dois temas, navegação por teclado, textos alternativos, verificação automática com axe-core
- [x] Pipeline diário no GitHub Actions: baixa, valida com Zod, calcula e publica; se algo vier diferente do esperado, **para sem publicar**

## Telas

| Capa no celular                                   | Resumo em números da ficha                                    | Caderno de dinheiro, edição noturna                                              |
| ------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ![Capa no celular](docs/imagens/capa-celular.jpg) | ![Resumo em números da ficha](docs/imagens/ficha-celular.jpg) | ![Caderno de dinheiro na edição noturna](docs/imagens/ficha-celular-noturna.jpg) |

## Arquitetura

O site nunca fala com a Câmara. Um pipeline agendado lê os dados abertos, valida, calcula e grava JSON no repositório; a Vercel builda o site estático a partir desses arquivos.

```mermaid
flowchart LR
    camara["Câmara dos Deputados<br/>arquivos estáticos + API"]
    pipeline["packages/pipeline<br/>fetch → normalize → compute → publish"]
    metrics["packages/metrics<br/>cálculo puro"]
    shared["packages/shared<br/>Zod, tipos, legislatura"]
    raw[("data/raw<br/>cache (fora do Git)")]
    gen[("data/generated<br/>JSON no Git")]
    web["apps/web (Astro)<br/>HTML estático na Vercel"]

    camara --> pipeline
    pipeline <--> raw
    pipeline --> metrics
    pipeline --> shared
    pipeline --> gen
    gen --> web
    shared --> web
```

Princípios que guiaram o código:

- **Cálculo separado do mundo.** `packages/metrics` só tem funções puras (sem rede, disco ou relógio) e é todo testado. Rede, cache e orquestração ficam em `packages/pipeline`.
- **Validação na entrada e na saída.** Esquemas Zod para o formato da Câmara e para os JSON gerados. Campo diferente do esperado: o pipeline falha com o caminho exato do problema e não publica. O site valida de novo no build.
- **Educado com a Câmara.** Arquivos estáticos para cargas grandes; na API, no máximo 2 requisições simultâneas, pausa entre elas e novas tentativas com espera crescente. Downloads ficam em cache.
- **Repositório trocável.** As páginas pedem dados a `DeputyRepository`. Hoje a implementação lê JSON; um banco PostgreSQL pode entrar depois sem mudar as páginas.
- **Legislatura configurável.** Trocar da 57ª para a 58ª é mudar uma constante em `packages/shared/src/legislature.ts`.

Mais detalhes em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) e nas decisões em [`docs/decisoes/`](docs/decisoes/).

## Tecnologias

| Camada      | Ferramenta                               | Por quê                                                                |
| ----------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Linguagem   | TypeScript (tudo)                        | Tipos e esquemas compartilhados entre pipeline e site                  |
| Site        | Astro 6, HTML estático                   | Site quase todo conteúdo: rápido, barato, sem JavaScript desnecessário |
| Estilo      | Tailwind CSS 4, Fraunces e Newsreader    | Tokens próprios de papel e tinta; fontes variáveis servidas pelo site  |
| Validação   | Zod 4                                    | Tudo que vem da Câmara e da CGU é validado antes de entrar no projeto  |
| Gráficos    | Componentes Astro (SVG e HTML) no build  | Zero JavaScript no navegador; leve no celular                          |
| Dados       | JSON gerado no Git (sem banco na Fase 0) | Zero infraestrutura; histórico dos dados no próprio repositório        |
| Agendamento | GitHub Actions (cron diário)             | Atualização dos dados sem servidor ligado                              |
| Hospedagem  | Vercel                                   | Deploy automático a cada commit de dados                               |
| Monorepo    | pnpm workspaces + Turborepo              | Site, pipeline e pacotes no mesmo repositório                          |
| Qualidade   | Vitest, ESLint, Prettier, axe-core       | Testes de cálculo e validação, lint, formatação e acessibilidade       |

## Estrutura de pastas

```
Extrapolar/
├── apps/
│   └── web/                        # Site em Astro
│       └── src/
│           ├── pages/              # index, deputados/[id], metodologia, sobre
│           ├── components/
│           │   ├── ficha/          # Caderno, bloco de métrica, resumo em números, "sem dado"
│           │   ├── charts/         # Barras, colunas e linha do tempo (gerados no build)
│           │   ├── ui/             # Manchete, régua, selo, número-manchete, linha de fonte
│           │   ├── deputado/       # Linha da lista, filtros, foto em meio-tom, seção de participação
│           │   └── layout/         # Cabeçalho (masthead), seletor de edição, rodapé
│           ├── layouts/            # Layout base
│           ├── lib/                # Leitura dos dados gerados, formatação (datas, %), estados
│           └── styles/             # Tokens, fontes, textura de papel
├── packages/
│   ├── shared/                     # Legislatura, esquemas Zod (entrada e saída), tipos, repositório
│   ├── metrics/                    # Funções puras de cada indicador (participação)
│   └── pipeline/                   # Rede, cache, normalização, orquestração
│       └── src/
│           ├── sources/            # camara-api.ts, camara-arquivos.ts
│           ├── normalize/          # Períodos em exercício, deputados, votações
│           ├── steps/              # fetch → normalize → compute → publish
│           └── lib/                # HTTP com novas tentativas, cache, horário de Brasília
├── data/
│   ├── raw/                        # Cache dos downloads (fora do Git)
│   └── generated/                  # deputados.json, deputados/{id}.json, metricas.json, frentes.json, meta.json
├── docs/
│   ├── ARQUITETURA.md  METODOLOGIA.md  DESIGN.md  FONTES.md  DEPLOY.md
│   ├── decisoes/                   # ADRs (0001-astro.md ...)
│   └── briefing-fase0.md           # Briefing original do projeto
├── scripts/                        # Neutralidade, acessibilidade, capturas de tela
├── .github/workflows/              # ci.yml (a cada push) e pipeline.yml (diário)
├── CLAUDE.md                       # Guia para o Claude Code
└── LICENSE
```

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 22.12 ou mais novo
- [pnpm](https://pnpm.io/) 10 (o jeito mais fácil: `corepack enable`)

### Passo a passo

```bash
# 1. Instale as dependências
pnpm install

# 2. Suba o site (os dados já vêm no repositório, em data/generated)
pnpm dev
```

Abra **http://localhost:4321**.

Para atualizar os dados com o que a Câmara publicou hoje:

```bash
pnpm pipeline              # usa o cache de data/raw quando ainda vale (20 horas)
pnpm pipeline -- --refresh # ignora o cache e baixa tudo de novo (~300 MB, 2 a 3 minutos)
```

### Scripts

| Comando                   | O que faz                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                | Site com recarga automática                                                        |
| `pnpm pipeline`           | Baixa, valida e calcula os dados da Câmara e grava `data/generated`                |
| `pnpm build`              | Gera o site estático em `apps/web/dist`                                            |
| `pnpm test`               | Todos os testes                                                                    |
| `pnpm typecheck`          | Confere os tipos (inclusive `astro check`)                                         |
| `pnpm lint`               | ESLint                                                                             |
| `pnpm format`             | Formata o código com Prettier (`format:check` só confere)                          |
| `pnpm check:neutralidade` | Procura palavras de julgamento nos textos do site (só avisa, nunca quebra)         |
| `pnpm check:a11y`         | Acessibilidade com axe-core e teste da busca pelo teclado (\*)                     |
| `pnpm screenshots`        | Capturas no celular e no desktop, claro e escuro, e alerta de rolagem lateral (\*) |

(\*) Precisam do site rodando (`pnpm build && pnpm --filter @extrapolar/web preview`) e do Google Chrome instalado.

## Dados e metodologia

Quase todos os números vêm dos [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/) (arquivos estáticos diários e, quando não há arquivo, a API). As emendas vêm do [Portal da Transparência](https://portaldatransparencia.gov.br/emendas) da CGU. Cada fonte, com link, formato conferido e condições de uso, está em [`docs/FONTES.md`](docs/FONTES.md).

Algumas regras que valem para tudo:

- Só a legislatura atual (57ª) e só os períodos em que cada deputado esteve em exercício (licenças e suplências respeitadas).
- Votações: só as **nominais** do **plenário** (as únicas com voto de cada deputado registrado).
- Projetos: **autor principal** (primeiro signatário) separado de coautoria e de assinaturas de apoio.
- Dinheiro: teto da cota só onde há tabela oficial; emendas ligadas ao deputado só por nome exato e único (ou conferência manual).

A explicação completa de cada métrica, com o que ela não mede e o que ficou de fora, está em [`docs/METODOLOGIA.md`](docs/METODOLOGIA.md) e na página `/metodologia`.

## Testes e verificações

```bash
pnpm test
```

| Pacote                 | Testes | O que cobrem                                                                                                                                                 |
| ---------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@extrapolar/shared`   |     18 | Legislatura, esquemas Zod com amostras reais e dados alterados, valor de métrica padronizado ("sem dado" com motivo conhecido)                               |
| `@extrapolar/metrics`  |     51 | Participação, presença, alinhamento, comissões, projetos (situação, temas, pareceres), fiscalização, discursos, cota e teto, emendas, frentes                |
| `@extrapolar/pipeline` |     59 | HTTP com novas tentativas, cache (inclusive download interrompido e cache calculado), CSV, períodos em exercício, orientações, sessões, proposições, emendas |
| `@extrapolar/web`      |     16 | Formatação de datas, porcentagens e reais em pt-BR e leitura validada dos dados gerados                                                                      |

O CI (`.github/workflows/ci.yml`) roda formatação, lint, neutralidade, tipos, testes e build a cada push.

## Deploy

O passo a passo está em [`docs/DEPLOY.md`](docs/DEPLOY.md). Resumo:

| Peça               | Onde           | Observação                                                                                     |
| ------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| Site (`apps/web`)  | Vercel         | Root Directory `apps/web`; o deploy acontece a cada commit no `main`                           |
| Atualização diária | GitHub Actions | `pipeline.yml` às 06:00 de Brasília: roda o pipeline, testa, builda e commita `data/generated` |

## Roadmap

- [x] **Fase 0** — Monorepo, documentação, pipeline de deputados, participação em votações nominais, capa, ficha e metodologia
- [x] **Fase 1** — Todas as métricas com dado oficial (7 cadernos), gráficos, glossário e design mais leve
- [ ] **Fase 2** — "Quem é meu deputado?" por estado e "Monte seu ranking" (o usuário escolhe os pesos; o site nunca define um ranking oficial)
- [ ] **Fase 3** — "Vote você também": votar nos mesmos projetos que a Câmara e ver quais deputados votam parecido
- [ ] **Fase 4** — Resumo semanal do que foi votado, gerado com IA a partir do texto oficial e revisado por humano
- [ ] **Fase 5** — Minigames diários: quiz sobre proposições e um "dle" de deputados

## Sobre mim

Sou **Lucas Barreto**, desenvolvedor. Criei o Extrapolar para aproximar da política quem nunca acompanhou, com dados oficiais apresentados de forma simples e neutra.

- LinkedIn: [linkedin.com/in/lucas-barreto-santana-67aa932b6](https://www.linkedin.com/in/lucas-barreto-santana-67aa932b6/)
- E-mail: [lucasbrsantana@gmail.com](mailto:lucasbrsantana@gmail.com)

Achou um número estranho ou tem uma ideia? Abra uma issue.

## Licença

[MIT](LICENSE) © 2026 Lucas Barreto
