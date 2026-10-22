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

1. **fetch** (`steps/fetch.ts`): baixa as fontes para `data/raw/` (com cache) e valida cada resposta com o esquema Zod de entrada.
   - `sources/camara-api.ts`: lista de deputados em exercício (`/deputados`) e histórico de cada um (`/deputados/{id}/historico`).
   - `sources/camara-arquivos.ts`: `votacoes-{ano}.json` e `votacoesVotos-{ano}.json` para cada ano da legislatura.
2. **normalize** (`steps/normalize.ts`): converte o formato da Câmara para os tipos internos (nomes em inglês, ids numéricos, períodos em exercício).
3. **compute** (`steps/compute.ts`): chama as funções de `packages/metrics`.
4. **publish** (`steps/publish.ts`): valida a saída com os esquemas de saída e grava `data/generated/` de forma atômica (pasta temporária + rename). Se qualquer validação falhar, nada é gravado.

### Cache (`data/raw/`)

- Respostas da API e arquivos estáticos ficam em `data/raw/`, com um `.meta.json` ao lado (data do download e `Last-Modified`).
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

## Preparado para o futuro (não implementado)

- **Banco de dados:** o site só fala com `DeputyRepository`. Para usar PostgreSQL, basta criar outra implementação (como no Chutaí: `Json…Repository` hoje, `Drizzle…Repository` depois) sem mudar as páginas.
- **Novas métricas:** cada uma é um arquivo em `packages/metrics/src/`, um arquivo de saída em `data/generated/` e uma seção em `docs/METODOLOGIA.md`.
- **Ilhas React:** quando houver jogos ou "monte seu ranking", adicionar `@astrojs/react` e usar `client:visible`.
- **Nova legislatura:** mudar `CURRENT_LEGISLATURE_ID` em `packages/shared/src/legislature.ts` (a 58ª já está cadastrada).

## Deploy

Ver `docs/DEPLOY.md`.
