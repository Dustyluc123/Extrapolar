# CLAUDE.md

Guia para o Claude Code (e para qualquer pessoa) trabalhar neste repositório.

**Extrapolar** é um site brasileiro que mostra, de forma simples e neutra, o que os deputados federais estão fazendo na Câmara. Público principal: jovens que **não** acompanham política. O site é estático; os dados vêm de um pipeline agendado que lê os dados abertos da Câmara (e as emendas da CGU) e gera JSON. A ficha de cada deputado é dividida em 7 **cadernos**: Plenário, Comissões, Projetos e leis, Fiscalização, Voz, Dinheiro público, Articulação e perfil. Desde a Fase 2, há quatro **jogos** (`/jogos`) com votações reais e o **Monte seu ranking** (`/ranking`), em que o leitor escolhe os critérios.

Os briefings originais estão em `docs/briefing-fase0.md`, `docs/briefing-fase1.md` e `docs/briefing-fase2.md`; os relatórios, em `docs/RELATORIO-NOITE.md`, `docs/RELATORIO-FASE1.md` e `docs/RELATORIO-FASE2.md`. Este arquivo e a pasta `docs/` são suficientes para entender o projeto sem eles.

## Princípios inegociáveis

1. **Neutralidade.** O site mostra números e fatos, nunca julgamentos. Proibido usar palavras como "melhor", "pior", "corrupto", "vergonha", "herói" em textos, nomes de variáveis visíveis, títulos ou componentes. Mostramos o dado e explicamos o contexto; quem conclui é o leitor. O site **nunca** define um ranking oficial: listas são ordenadas por nome, e métricas não aparecem em listas ordenáveis. Exceções, sempre com o critério do leitor: `/ranking` (métricas, pesos e direção escolhidos por ele, nada marcado de início) e o resultado do jogo "Vote você também" (ordenado pela concordância com os votos do próprio jogador).
2. **Todo número é verificável.** Cada métrica exibida tem a fonte oficial, a data da última atualização e um link para a metodologia (`/metodologia#<métrica>`).
3. **Nunca invente dados.** Se um valor não vier de uma fonte oficial, ele fica `null` com o comentário `// TODO: conferir na fonte oficial: <link>` e entra na lista de pendências. Nunca preencha números de memória. Ausência de dado é `null`, nunca `0`.
4. **Custo perto de zero.** Sem servidor rodando 24 horas. Site estático; dados atualizados por tarefa agendada (GitHub Actions).
5. **Contexto das métricas.** Toda métrica tem limitações documentadas em `docs/METODOLOGIA.md` (o que mede e o que **não** mede).

Uma varredura de palavras de julgamento (`pnpm check:neutralidade`, `scripts/check-neutrality.mjs`) roda no CI sobre `apps/web/src` e `content/resumos` e gera **aviso**, não erro. A lista de palavras fica em `scripts/lib/neutrality-words.mjs`; exceções aprovadas (arquivo + trecho + motivo) ficam em `scripts/neutrality-allowlist.json`. Atenção: `docs/METODOLOGIA.md` também aparece no site (`/metodologia`), mas não é varrido; revise à mão.

## Idioma e nomes

- Interface, documentação, comentários, mensagens de erro, nomes de testes e commits: **português do Brasil**.
- Identificadores de código (variáveis, funções, tipos, arquivos `.ts`): **inglês**. Exceção: campos que vêm da Câmara mantêm o nome original (`siglaPartido`, `siglaUf`, `idVotacao`…) nos esquemas de entrada; a normalização converte para inglês.
- Rotas do site em português: `/deputados/[id]`, `/jogos`, `/jogos/dle`, `/jogos/placar`, `/jogos/vote-voce-tambem`, `/jogos/seja-deputado`, `/jogos/votacoes`, `/ranking`, `/metodologia`, `/glossario`, `/sobre`.
- Glossário de código: deputado = `Deputy`; votação = `Vote` (o evento); voto individual = `Ballot`; período em exercício = `ServicePeriod`; legislatura = `Legislature`; participação = `participation`. Os cadernos no JSON gerado usam os nomes em português (`plenario`, `comissoes`, `projetos`, `fiscalizacao`, `voz`, `dinheiro`, `articulacao`), porque viram texto do site.

## Comandos

pnpm 10 + Turborepo, Node >= 22.12 (`.nvmrc`).

```bash
pnpm install
pnpm dev            # site em http://localhost:4321 (lê data/generated)
pnpm pipeline       # baixa dados da Câmara e da CGU (com cache em data/raw) e gera data/generated
pnpm test           # Vitest em todos os pacotes
pnpm typecheck      # tsc nos pacotes + astro check no site
pnpm lint           # ESLint (flat config na raiz)
pnpm format         # Prettier; format:check no CI
pnpm build          # build estático do site em apps/web/dist
pnpm check:neutralidade   # varredura de palavras de julgamento (só avisa)
pnpm check:a11y           # axe-core + busca pelo teclado (precisa do preview rodando e do Chrome)
pnpm check:a11y:jogos     # axe-core nos jogos e no ranking depois de jogar (idem)
pnpm screenshots          # capturas celular/desktop, claro/escuro + alerta de rolagem lateral
pnpm repo-growth          # quanto o commit de data/generated vai acrescentar ao repositório
node scripts/resumos.mjs pendentes      # votações dos jogos sem resumo (usado pelo /resumos)
node scripts/resumos.mjs fontes <id>    # baixa ementa, parecer e redação final para data/raw/resumos/<id>
```

`check:a11y`, `check:a11y:jogos` e `screenshots` precisam de `pnpm build && pnpm --filter @extrapolar/web preview` (porta 4321) e do Google Chrome; o controle do Chrome fica em `scripts/lib/chrome.mjs`. Capturas vão para `docs/screenshots/` (fora do Git); as imagens do README ficam em `docs/imagens/`.

Um pacote ou um teste:

```bash
pnpm --filter @extrapolar/metrics test
pnpm --filter @extrapolar/pipeline exec vitest run tests/service-periods.test.ts
pnpm --filter @extrapolar/metrics exec vitest run -t "nome do teste"
```

Opções do pipeline: `pnpm pipeline -- --refresh` ignora o cache e baixa tudo de novo (inclusive os discursos, ~12 min). `EXTRAPOLAR_LIST_UNLINKED=1 pnpm pipeline` lista os autores de emendas não ligados a deputados. Capturas de um caderno: `node scripts/screenshots.mjs "/deputados/204379#caderno-dinheiro"` (com `SCREENSHOT_MAX_HEIGHT=3000`). O pipeline roda com heap de 6 GB (arquivos de proposições e frentes passam de 150 MB). O sorteio diário dos jogos usa `EXTRAPOLAR_DAILY_SECRET` (segredo do GitHub Actions); sem ele, usa uma chave local e avisa no log (ADR 0020). Se a porta 4321 estiver ocupada, o preview sobe em outra (ex.: 4322) e os scripts aceitam `BASE_URL=http://localhost:4322`.

## Arquitetura

Detalhes em `docs/ARQUITETURA.md`. Resumo:

- `packages/shared` — legislatura configurável (`src/legislature.ts`: trocar de legislatura = mudar `CURRENT_LEGISLATURE_ID`), esquemas Zod de **entrada** (`schemas/camara.ts`: formato da Câmara e da CGU) e de **saída** (`schemas/generated.ts`), motivos de "sem dado" (`no-data.ts`), a interface `DeputyRepository` e **configurações preenchidas à mão** com fonte: `config/ceap-tetos.ts` (teto da cota por UF e vigência; `null` onde não há tabela oficial) e `config/emendas-autores.ts` (correspondências manuais autor da CGU → deputado).
- `packages/metrics` — funções **puras** que calculam indicadores e o "Monte seu ranking" (`ranking.ts`: percentil, nota, contribuição, critérios na URL). Sem rede, sem disco, sem `Date.now()` (a data de referência entra como argumento). Tudo aqui tem teste.
- `packages/games` — regras **puras** dos jogos: dia de Brasília, sorteio por ciclos (adaptado do Chutaí), embaralhamento da resposta, comparação de atributos do Dle, pontuação do Placar, concordância, sequência e textos de compartilhar. Usado pelo pipeline e pelas ilhas React.
- `packages/pipeline` — rede, disco e orquestração: `sources/` (uma fonte por arquivo) → `normalize/` → `steps/` (`fetch → normalize → compute → publish`), com um módulo de cálculo por caderno em `steps/metrics/`. Arquivos grandes são reduzidos ano a ano logo depois de validados (`steps/fetch.ts`). Valida tudo com Zod; se algo vier diferente do esperado, **falha com mensagem clara e não publica**. A publicação é atômica (escreve em temporário e renomeia).
- `apps/web` — Astro, HTML estático. Lê `data/generated/*.json` no build por meio de `JsonDeputyRepository` (`src/lib/data.ts`), que valida com os esquemas de saída. **Nunca** chama a API da Câmara. Interatividade mínima com `<script>` do Astro; ilhas React (`@astrojs/react` 5, que roda no Vite 7 do Astro 6 — a versão 7 puxa o Vite 8 e quebra o build) só nos jogos (`components/games/`) e no ranking (`components/ranking/`), ADR 0021. Dados grandes para as ilhas saem como arquivos estáticos gerados no build (`/jogos/dados/dle-UF.json`, `/ranking/dados.json`). Estado do jogador só em `localStorage` (`extrapolar:jogos:*`), sempre com try/catch.
- `data/raw/` — cache de downloads (fora do Git; discursos e lideranças guardam só o resultado reduzido). `data/generated/` — JSON final (no Git; ADRs 0004 e 0012): `deputados.json` (índice), `deputados/{id}.json` (detalhe por caderno, sem a data da edição), `metricas.json` (valores brutos para a Fase 2, sem ranking), `frentes.json` (títulos das frentes), `meta.json` (fontes, data de referência, avisos de qualidade, totais) e `jogos/` (votações elegíveis, deputados na ordem dos votos compactos, Dle por estado, Placar, rodada semanal, votação mais recente e o estado do sorteio, `sorteio.json`, que só cresce). `content/resumos/{idVotacao}.md` — resumos de votações em linguagem simples (seções "O que estava em votação", "Curiosidade" e "Dúvidas"; formato em `content/resumos/LEIA-ME.md`). Rascunhos escritos pelo comando `/resumos` com `revisado: false`; só vão para o site depois que o Lucas revisa e marca `revisado: true` (ADR 0022).
- Valor de métrica padronizado: `MetricValue` = `ok` (valor, numerador, denominador) ou `sem-dado` com motivo de `packages/shared/src/no-data.ts`. Nunca 0 no lugar de sem dado.

Pacotes internos não têm build: exportam `src/*.ts` direto (padrão do Chutaí).

## Regras para dados da Câmara e da CGU

- Preferir os **arquivos estáticos** (`https://dadosabertos.camara.leg.br/arquivos/...`) para cargas grandes. A API (`/api/v2`) só quando não houver arquivo, sempre com pausa entre requisições, concorrência baixa e novas tentativas com espera crescente (`packages/pipeline/src/lib/http.ts`).
- Formatos reais conferidos estão descritos em `docs/FONTES.md`. Atenção: no arquivo de votos, `deputado_.id` vem como **texto**; na API, `id` é número.
- Participação usa só **votações nominais de plenário** (`siglaOrgao = "PLEN"` com votos individuais registrados). Ver `docs/METODOLOGIA.md`.
- Toda fonte nova: baixar uma amostra real, conferir campos, escrever o esquema Zod e registrar o formato em `docs/FONTES.md`. CSVs (cota, CGU) passam pelo leitor completo `packages/pipeline/src/lib/csv.ts` (há `;` dentro de campos).
- Discursos só pela API, com cache semanal e tolerância a erro 500 persistente da Câmara (ADR 0015). A ficha não reproduz o conteúdo das falas (ADR 0016).
- Emendas: ligação autor → deputado só por nome normalizado exato e único, ou manual (ADR 0018). **Nunca por semelhança.**
- O site não mostra médias, comparações nem ranking (ADR 0010), exceto o `/ranking` montado pelo leitor; `metricas.json` guarda valor, numerador e denominador e alimenta o ranking.
- Votações dos jogos: só nominais de plenário, não secretas, **de mérito** (lista fechada de começos da descrição oficial) e com proposição identificada (ligada, arquivos anuais, busca na API trimestre a trimestre, projetos renumerados). Resultado sempre do campo oficial `aprovacao`, nunca deduzido do placar (ADR 0019).

## Decisões

ADRs curtos em `docs/decisoes/NNNN-titulo.md`. Toda decisão de arquitetura ou de metodologia relevante ganha um ADR. ADRs da Fase 1: 0012 (dados por deputado), 0013 (gráficos estáticos), 0014 (orientação de bloco), 0015 e 0016 (discursos), 0017 (teto da cota), 0018 (emendas). Fase 2: 0019 (votações elegíveis), 0020 (sorteio diário num site estático), 0021 (ilhas React e estado só no navegador) e 0010 atualizado (exceção do ranking). Depois: 0022 (resumos das votações: rascunho com IA, revisão humana). Fases futuras previstas (não implementar sem pedido): login/contas, salvar rankings em servidor, PostgreSQL.

## Ficha e design

- Cada métrica é um `Metric.astro` (título, "Traduzindo:", número, gráfico, "O que é isso?", "O que este número não mostra", fonte). "Sem dado" é sempre `NoData.astro` com motivo.
- Gráficos estáticos em `apps/web/src/components/charts/` (ADR 0013); termos linkados ao `/glossario` com `Term.astro` (o build falha se o termo não existir em `src/lib/glossary.ts`).
- Humor só na moldura (carimbos, recortes, "Classificados", "Errata", "Edição extra" e carimbo APROVADA/REJEITADA nos jogos); nunca sobre deputados, partidos ou posições. Ver `docs/DESIGN.md`.
- Jogos: testam o que aconteceu, nunca opinião; nada de jogo que compare deputados entre si; texto sem gênero inventado ("a cadeira é sua", não "você é deputado"). Cores de acerto (verde/amarelo/vermelho) sempre com símbolo, e falam do chute, nunca do deputado.

## Trabalho

- **No começo de cada sessão, rode `git pull --rebase`**: o robô da atualização diária faz commits no `main` todos os dias.
- Commits pequenos, em português, ao fim de cada etapa.
- Testes para tudo em `packages/metrics` e para a validação de dados.
- Se algo parecer ambíguo ou errado, perguntar antes de seguir.

### Rotina semanal: resumos das votações

1. Rodar `/resumos` no Claude Code (`.claude/commands/resumos.md`): ele lista as votações dos jogos sem resumo (Placar, Vote você também, Seja deputado), lê a ementa e o texto oficial e escreve os rascunhos em `content/resumos/` com `revisado: false`. O Claude **nunca** marca um resumo como revisado.
2. O Lucas revisa em `pnpm dev` → http://localhost:4321/dev/resumos (ementa e rascunho lado a lado; página só de desenvolvimento, não vai para o build), resolve a seção "Dúvidas" e troca para `revisado: true`.
3. Commit dos resumos revisados; a próxima execução do pipeline publica os textos nos jogos.

## Segundo cérebro (Obsidian)

O Lucas mantém um vault Obsidian em `/Users/lucasbarretosantana/Documents/segundocerebro`. A pasta deste projeto lá é `01-Projetos/Extrapolar/`. Siga as convenções descritas no `CLAUDE.md` da raiz do vault (frontmatter, `[[links]]`, nomes únicos).

**Ao final de toda sessão que mudou algo relevante**, antes de encerrar:

1. Crie `01-Projetos/Extrapolar/Sessões/AAAA-MM-DD-assunto-curto.md` com:
   - O que foi feito (curto, em tópicos)
   - Decisões tomadas e o porquê
   - Problemas encontrados e como resolveu
   - Próximos passos
   - Arquivos/commits principais
2. Se houve uma decisão de arquitetura ou de produto, crie também uma nota em `Decisões/` (contexto → decisão → alternativas descartadas → consequências) e linke na sessão.
3. Atualize a seção "Status atual" e "Próximos passos" de `01-Projetos/Extrapolar/Extrapolar.md`.
4. Ideias que surgirem e não forem feitas agora vão para `Ideias/`.
5. Aprendizado técnico reutilizável fora deste projeto (ex.: um padrão de Socket.IO, uma pegadinha do Next.js) vai para `00-Inbox/` com `fonte: claude-code` — o organizador do vault decide onde guardar.

**No início de uma sessão**, leia a nota-índice do projeto e a última sessão para pegar o contexto.

Não escreva no vault fora de `01-Projetos/Extrapolar/` e `00-Inbox/`. Nunca coloque segredos (chaves de API, senhas, `.env`) nas notas.

### Liberar o acesso ao vault

Por padrão o Claude Code só mexe na pasta do projeto. Para ele poder escrever no vault, crie (ou edite) `.claude/settings.json` no repositório:

```json
{
  "permissions": {
    "additionalDirectories": ["CAMINHO/DO/VAULT"]
  }
}
```

Alternativa pontual: abrir com `claude --add-dir CAMINHO/DO/VAULT`.

Se quiser que o registro aconteça mesmo quando você esquecer de pedir, peça no fim da sessão: **"registra a sessão no Obsidian"** — com o trecho acima no CLAUDE.md, ele já sabe o formato.
