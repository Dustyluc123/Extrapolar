# Arquitetura

## Visão geral

```
                 GitHub Actions (cron diário)
                            │
  Câmara (arquivos + API) ──▶ packages/pipeline ──▶ data/generated/*.json ──▶ commit no main
                            │        │                                          │
                            │        └── usa packages/metrics (cálculo puro)    ▼
                            │        └── usa packages/shared (Zod, legislatura) Vercel builda
                            ▼                                                   apps/web (Astro)
                       data/raw/ (cache)                                        → HTML estático
```

O site nunca fala com a Câmara. Se a API da Câmara cair, o site continua no ar com os últimos dados publicados; o pipeline falha, não commita nada e o GitHub avisa.

## Pacotes

| Pacote              | Responsabilidade                                                                              | Pode acessar rede/disco?                                        |
| ------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/shared`   | Legislatura configurável, esquemas Zod (entrada e saída), tipos, interface `DeputyRepository` | Não                                                             |
| `packages/metrics`  | Cálculo puro de cada indicador                                                                | Não                                                             |
| `packages/pipeline` | Download, cache, validação, normalização, orquestração, escrita dos JSON                      | Sim                                                             |
| `apps/web`          | Site Astro, lê `data/generated` no build                                                      | Só leitura de `data/generated` e `docs/METODOLOGIA.md` no build |

Pacotes internos não têm etapa de build: exportam `src/index.ts` e são consumidos direto (tsx no pipeline, Vite no Astro).

## Pipeline

`packages/pipeline/src/index.ts` roda as etapas em ordem:

1. **fetch** (`steps/fetch.ts`): baixa as fontes para `data/raw/` (com cache) e valida cada resposta com o esquema Zod de entrada. Arquivos anuais grandes são **reduzidos logo depois de validados**, um ano por vez, para os brutos de todos os anos nunca ficarem juntos na memória.
   - `sources/camara-api.ts`: deputados em exercício, histórico de cada um, federações (`/blocos`), temas oficiais, discursos (cache semanal, coleta tolerante a erro 500 da API) e a função `splitDateRange`.
   - `sources/camara-arquivos.ts`: catálogo de arquivos por ano (votações, votos, orientações, eventos, órgãos dos eventos, presenças, requerimentos de eventos, proposições, autores, temas) e arquivos sem ano (órgãos, membros dos órgãos da legislatura).
   - `sources/dinheiro.ts` + `sources/zipped-csv.ts`: cota parlamentar (`camara.leg.br/cotas/Ano-{ano}.csv.zip`), funcionários e emendas da CGU (zip com CSV em Latin-1).
   - `sources/articulacao.ts`: frentes, membros das frentes, Mesa, profissões, ocupações e lideranças (API).
2. **normalize** (`steps/normalize.ts` + `normalize/`): converte para os tipos internos — períodos em exercício, votações e votos, sessões e reuniões, orientações (partido → federação; bloco não), cargos em órgãos, autoria compacta, proposições reduzidas, cota por mês e categoria, ligação autor de emenda → deputado.
3. **compute** (`steps/compute.ts` + `steps/metrics/<caderno>.ts`): chama as funções puras de `packages/metrics`, monta o detalhe de cada deputado por caderno e o índice `metricas.json` (lista `METRIC_DEFINITIONS`).
4. **publish** (`steps/publish.ts`): valida a saída com os esquemas de saída e grava `data/generated/` de forma atômica (pasta temporária + rename); remove arquivos de deputados que saíram de exercício. Se qualquer validação falhar, nada é gravado.

Avisos de qualidade dos dados (inconsistências que não impedem a publicação) vão para `meta.json` e para o log.

### Cache (`data/raw/`)

- Respostas da API e arquivos estáticos (inclusive zips) ficam em `data/raw/`, com um `.meta.json` ao lado (data do download e `Last-Modified`). Discursos e lideranças guardam só o resultado reduzido (`cachedComputed`), com validade própria (discursos: 7 dias).
- Validade padrão: 20 horas. Arquivos estáticos vencidos são conferidos com `HEAD`: se o `Last-Modified` não mudou, o arquivo em cache é reaproveitado.
- `--refresh` ignora o cache.
- No GitHub Actions, `data/raw/` é guardado com `actions/cache` entre execuções.

### Acesso à API

`src/lib/http.ts`: no máximo 2 requisições simultâneas, pausa mínima entre requisições, até 5 tentativas com espera exponencial em erros de rede, 429 e 5xx. Erros 4xx (exceto 429) falham na hora.

## Dados gerados (`data/generated/`)

| Arquivo               | Conteúdo                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `meta.json`           | Data/hora da geração, legislatura, fontes usadas com URL e `Last-Modified`, avisos de qualidade dos dados e totais da legislatura     |
| `deputados.json`      | Índice dos deputados em exercício: id, nome, partido, UF, foto oficial (URL), situação, condição eleitoral                            |
| `deputados/{id}.json` | Detalhe de cada deputado, por caderno (Plenário, Comissões...). Sem a data da edição, para só mudar quando os dados mudam (ADR 0012)  |
| `metricas.json`       | Valor bruto, numerador, denominador ou "sem dado" de cada métrica para cada deputado, para a futura ordenação da Fase 2 (sem ranking) |

Os formatos estão definidos (e validados) em `packages/shared/src/schemas/generated.ts`. `pnpm repo-growth` mede quanto o commit de dados acrescenta ao repositório.

## Site (`apps/web`)

- Astro com `output: "static"`. Todas as páginas são geradas no build.
- `src/lib/data.ts` implementa `DeputyRepository` lendo os JSON gerados, inclusive os 513 detalhes por `import.meta.glob` (validação Zod no build: dado quebrado quebra o build, não a página).
- Ficha organizada em cadernos (`components/ficha/`): cada métrica é um `Metric.astro` com número, gráfico, "O que é isso?", "O que este número não mostra" e fonte. Gráficos em `components/charts/`, estáticos (ADR 0013). Glossário em `src/lib/glossary.ts` → `/glossario`; termos linkados com `Term.astro`.
- Interatividade da capa (busca e filtros) em `<script>` do Astro, sem framework.
- Tailwind CSS 4 com tokens próprios em `src/styles/tokens.css` (ver `docs/DESIGN.md`).
- `/metodologia` é gerada a partir de `docs/METODOLOGIA.md` (content collection com loader `glob`).
- **Mesa de votação (ADR 0025):** as ilhas dos jogos desenham sobre peças comuns de `components/games/desk/` (`Desk`, `Oficio`, `StampPad`, `InkMark`, `PlenaryPanel`, `Badge`, `SoundToggle`), com estilos em `styles/desk.css` (só nas páginas dos jogos). Som opcional em `src/lib/games/sound.ts` (Web Audio, sem arquivos); inclinação fixa da marca de carimbo em `src/lib/games/tilt.ts` (testada). As regras continuam em `@extrapolar/games`.
- **Contagem de visitas (ADR 0024):** `<Analytics />` de `@vercel/analytics/astro` no fim do `BaseLayout.astro`, com `beforeSend` que tira query string e âncora. Só visualizações de página.
- **Prévias ao compartilhar (ADR 0023):** `BaseLayout.astro` escreve as meta tags Open Graph e Twitter com URLs absolutas (`src/lib/site.ts`: `SITE_URL` → domínio de produção da Vercel → localhost). As imagens (1200 × 630, PNG) são geradas no build por `src/pages/og/[...slug].png.ts` com satori + resvg + sharp (`src/lib/og/`): uma geral, uma para os jogos, uma por jogo, uma para o ranking e uma por deputado (foto oficial em meio-tom, sem métricas). Não vão para o Git.

## Preparado para o futuro (não implementado)

- **Banco de dados:** o site só fala com `DeputyRepository`. Para usar PostgreSQL, basta criar outra implementação (como no Chutaí: `Json…Repository` hoje, `Drizzle…Repository` depois) sem mudar as páginas.
- **Novas métricas:** cada uma é um arquivo em `packages/metrics/src/`, um arquivo de saída em `data/generated/` e uma seção em `docs/METODOLOGIA.md`.
- **Ilhas React:** quando houver jogos ou "monte seu ranking", adicionar `@astrojs/react` e usar `client:visible`.
- **Nova legislatura:** mudar `CURRENT_LEGISLATURE_ID` em `packages/shared/src/legislature.ts` (a 58ª já está cadastrada).

## Deploy

Ver `docs/DEPLOY.md`.

## Fase 2 — Jogos e "Monte seu ranking"

```
pipeline (6h de Brasília)
  fetch: + votacoesProposicoes-{ano}, deputados.json (todas as legislaturas),
           API de proposições (citadas e renumeradas)
  compute → steps/games/
     catalog.ts     votações elegíveis (ADR 0019) + votos compactos
     dle.ts         atributos por estado + sorteio
     placar.ts      sorteio entre as elegíveis dos últimos 12 meses
     vote-round.ts  rodada semanal (10) e votação mais recente, com orientações
     draw.ts        DrawState: HMAC com EXTRAPOLAR_DAILY_SECRET, hoje + 3 dias, picks (ADR 0020)
     summaries.ts   content/resumos/*.md (só revisados; leitor em packages/shared/src/summaries.ts)
  publish → data/generated/jogos/*.json (validados com schemas/games.ts)

site (build)
  /jogos/*            páginas Astro + ilhas React (client:load)
  /jogos/dados/dle-UF.json, /ranking/dados.json   arquivos estáticos para as ilhas
navegador
  @extrapolar/games e @extrapolar/metrics (ranking): regras puras
  localStorage extrapolar:jogos:* (try/catch); nada é enviado
```

- **Votos compactos:** um caractere por deputado em exercício (`S N A O P -`), na ordem de `jogos/deputados.json`. Orientações de partido também em texto compacto (`S N A O L B -`).
- **Embaralhamento:** cada dia sorteado vai como `scramble(JSON, data)` (XOR com a data invertida + base64). Não é segredo: evita só que a resposta apareça num olhar casual.
- **Ranking:** `/ranking/dados.json` (~160 KB, ~40 KB comprimido) é montado no build a partir de `metricas.json`; o cálculo (`buildRanking`) roda no navegador a cada mudança de critério ou filtro.
