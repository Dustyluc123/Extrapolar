# CLAUDE.md

Guia para o Claude Code (e para qualquer pessoa) trabalhar neste repositório.

**Extrapolar** é um site brasileiro que mostra, de forma simples e neutra, o que os deputados federais estão fazendo na Câmara. Público principal: jovens que **não** acompanham política. O site é estático; os dados vêm de um pipeline agendado que lê os dados abertos da Câmara e gera JSON.

O briefing original está em `docs/briefing-fase0.md`. Este arquivo e a pasta `docs/` são suficientes para entender o projeto sem ele.

## Princípios inegociáveis

1. **Neutralidade.** O site mostra números e fatos, nunca julgamentos. Proibido usar palavras como "melhor", "pior", "corrupto", "vergonha", "herói" em textos, nomes de variáveis visíveis, títulos ou componentes. Mostramos o dado e explicamos o contexto; quem conclui é o leitor. O site **nunca** define um ranking oficial: listas são ordenadas por nome, e métricas não aparecem em listas ordenáveis.
2. **Todo número é verificável.** Cada métrica exibida tem a fonte oficial, a data da última atualização e um link para a metodologia (`/metodologia#<métrica>`).
3. **Nunca invente dados.** Se um valor não vier de uma fonte oficial, ele fica `null` com o comentário `// TODO: conferir na fonte oficial: <link>` e entra na lista de pendências. Nunca preencha números de memória. Ausência de dado é `null`, nunca `0`.
4. **Custo perto de zero.** Sem servidor rodando 24 horas. Site estático; dados atualizados por tarefa agendada (GitHub Actions).
5. **Contexto das métricas.** Toda métrica tem limitações documentadas em `docs/METODOLOGIA.md` (o que mede e o que **não** mede).

Uma varredura de palavras de julgamento roda no CI só sobre `apps/web/src` e gera **aviso**, não erro. Exceções ficam em `scripts/neutrality-allowlist.json` (ver `scripts/check-neutrality.ts`).

## Idioma e nomes

- Interface, documentação, comentários, mensagens de erro, nomes de testes e commits: **português do Brasil**.
- Identificadores de código (variáveis, funções, tipos, arquivos `.ts`): **inglês**. Exceção: campos que vêm da Câmara mantêm o nome original (`siglaPartido`, `siglaUf`, `idVotacao`…) nos esquemas de entrada; a normalização converte para inglês.
- Rotas do site em português: `/deputados/[id]`, `/metodologia`, `/sobre`.
- Glossário de código: deputado = `Deputy`; votação = `Vote` (o evento); voto individual = `Ballot`; período em exercício = `ServicePeriod`; legislatura = `Legislature`; participação = `participation`.

## Comandos

pnpm 10 + Turborepo, Node >= 22.12 (`.nvmrc`).

```bash
pnpm install
pnpm dev            # site em http://localhost:4321 (lê data/generated)
pnpm pipeline       # baixa dados da Câmara (com cache em data/raw) e gera data/generated
pnpm test           # Vitest em todos os pacotes
pnpm typecheck      # tsc nos pacotes + astro check no site
pnpm lint           # ESLint (flat config na raiz)
pnpm format         # Prettier; format:check no CI
pnpm build          # build estático do site em apps/web/dist
pnpm check:neutralidade   # varredura de palavras de julgamento (só avisa)
```

Um pacote ou um teste:

```bash
pnpm --filter @extrapolar/metrics test
pnpm --filter @extrapolar/pipeline exec vitest run tests/periods.test.ts
pnpm --filter @extrapolar/metrics exec vitest run -t "nome do teste"
```

Opções do pipeline: `pnpm pipeline -- --refresh` ignora o cache e baixa tudo de novo.

## Arquitetura

Detalhes em `docs/ARQUITETURA.md`. Resumo:

- `packages/shared` — legislatura configurável (`src/legislature.ts`: trocar de legislatura = mudar `CURRENT_LEGISLATURE_ID`), esquemas Zod de **entrada** (formato da Câmara) e de **saída** (JSON gerado), tipos e a interface `DeputyRepository`.
- `packages/metrics` — funções **puras** que calculam indicadores. Sem rede, sem disco, sem `Date.now()` (a data de referência entra como argumento). Tudo aqui tem teste.
- `packages/pipeline` — rede, disco e orquestração: `sources/` (uma fonte por arquivo) → `steps/` (`fetch → normalize → compute → publish`). Valida tudo com Zod; se algo vier diferente do esperado, **falha com mensagem clara e não publica**. A publicação é atômica (escreve em temporário e renomeia).
- `apps/web` — Astro, HTML estático. Lê `data/generated/*.json` no build por meio de `JsonDeputyRepository` (`src/lib/data.ts`), que valida com os esquemas de saída. **Nunca** chama a API da Câmara. Interatividade mínima com `<script>` do Astro; ilhas React só quando houver interação de verdade (jogos, "monte seu ranking" — fases futuras).
- `data/raw/` — cache de downloads (fora do Git). `data/generated/` — JSON final (no Git; ver ADR 0004).

Pacotes internos não têm build: exportam `src/*.ts` direto (padrão do Chutaí).

## Regras para dados da Câmara

- Preferir os **arquivos estáticos** (`https://dadosabertos.camara.leg.br/arquivos/...`) para cargas grandes. A API (`/api/v2`) só quando não houver arquivo, sempre com pausa entre requisições, concorrência baixa e novas tentativas com espera crescente (`packages/pipeline/src/lib/http.ts`).
- Formatos reais conferidos estão descritos em `docs/FONTES.md`. Atenção: no arquivo de votos, `deputado_.id` vem como **texto**; na API, `id` é número.
- Participação usa só **votações nominais de plenário** (`siglaOrgao = "PLEN"` com votos individuais registrados). Ver `docs/METODOLOGIA.md`.

## Decisões

ADRs curtos em `docs/decisoes/NNNN-titulo.md`. Toda decisão de arquitetura ou de metodologia relevante ganha um ADR. Fases futuras previstas (não implementar sem pedido): métricas de gastos e proposições, "monte seu ranking", "quem é meu deputado?", "vote você também", resumo semanal com IA revisado por humano, minigames, PostgreSQL.

## Trabalho

- Commits pequenos, em português, ao fim de cada etapa.
- Testes para tudo em `packages/metrics` e para a validação de dados.
- Se algo parecer ambíguo ou errado, perguntar antes de seguir.
