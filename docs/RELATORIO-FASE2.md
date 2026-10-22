# Relatório — Fase 2 (jogos + "Monte seu ranking")

Execução de 22 de outubro de 2026, depois da aprovação do plano (`docs/PLANO-FASE2.md`), sem perguntas durante o caminho, com um commit por etapa. Nada foi enviado ao GitHub (sem `git push`).

## Resumo

**A Fase 2 está pronta localmente.** O fechamento da Fase 1 foi concluído (etapa 0), e o site ganhou `/jogos`, com os quatro jogos funcionando no celular e no computador, nos dois temas, com "Como jogar", sequência, estatísticas e compartilhar sem spoiler, e `/ranking`, com escolha de métricas, pesos, direções, filtros, contribuição de cada métrica e link compartilhável. As votações usadas nos jogos seguem um método documentado e conferido à mão numa amostra de 120: nenhum erro na versão final. Formatação, lint, neutralidade, tipos, **243 testes** e build passam. O axe-core não acha violações em `/jogos`, nos quatro jogos e em `/ranking`, nem no estado inicial nem depois de jogar. As capturas de celular não têm rolagem lateral.

O que mais merece seu olhar, nesta ordem:

1. **Crie o segredo `EXTRAPOLAR_DAILY_SECRET` no GitHub** (passo a passo em "TODOs"). Sem ele, quem ler o código consegue prever o sorteio de todos os dias. Os dias já publicados não mudam quando o segredo for criado.
2. **Quase toda votação de mérito é aprovada** (214 de 216). Por isso o Placar pergunta como votou a maioria do seu estado (decidido no planejamento) e explica o quórum de PEC e PLP quando o resultado surpreende.
3. **Projetos renumerados:** a Câmara deu número novo a projetos antigos (o "PL 6.385/2016" citado na descrição da votação é hoje o PL 2.721/2023). Criei uma regra estrita para aceitar esses casos (ADR 0019). ⚠
4. **O "Monte seu ranking"** é a única lista ordenada do site. Ele começa vazio e não tem padrão; usei "maior sobe na lista" / "menor sobe na lista" em vez de "mais é melhor" (palavra que a varredura de neutralidade sinaliza). ⚠
5. **Crescimento do repositório (Fase 1):** as medidas estão no `RELATORIO-FASE1.md`. Uma vez por semana, os 513 arquivos de deputados mudam só pela data da consulta dos discursos (~540 KB no Git); decisão sua.

| Commit    | Etapa                                                                     |
| --------- | ------------------------------------------------------------------------- |
| `f22b130` | 0 — Fechamento da Fase 1 (medidas, workflow, README, CLAUDE.md)           |
| `65ec358` | 1 — Base dos jogos (votações elegíveis, sorteio, pacote de regras)        |
| `4bc2bb3` | 2 — Jogo 1: Dle do seu estado                                             |
| `1d1f549` | 3 — Jogo 2: Placar                                                        |
| `53974b3` | 4 — Jogo 3: Vote você também                                              |
| `e2d8972` | 5 — Jogo 4: Seja deputado                                                 |
| `934e357` | 6 — Monte seu ranking                                                     |
| (este)    | 7 — Fechamento: workflow, a11y depois de jogar, capturas, docs, relatório |

## O que foi feito em cada etapa

### Etapa 0 — Fechamento da Fase 1 (`f22b130`)

- Pipeline medido com cache (58 s) e sem cache (19 min, quase tudo nos discursos, com muitos erros 500 da API). Crescimento do repositório medido: ~2 KB num dia comum e ~540 KB por semana, quando o cache de discursos vence. Três alternativas descritas.
- As duas seções "Medidas" do relatório viraram uma, preenchida.
- `CLAUDE.md`: a seção do Obsidian perdeu só o texto de modelo (título "Trecho para colar…", a frase "Cole a seção abaixo…" e os separadores). `NOME_DO_PROJETO` virou `Extrapolar`, como o próprio modelo mandava. As instruções foram mantidas, inclusive "Liberar o acesso ao vault" (na dúvida, mantive) e o `CAMINHO/DO/VAULT` do exemplo.
- Os caminhos `~/Downloads/Extrapolar` dos relatórios viraram `~/Documents/Extrapolar`. O briefing original não foi alterado.
- Conferido numa cópia limpa do repositório (`git worktree`): formatação, lint, neutralidade, tipos, testes e build.

### Etapa 1 — Base dos jogos (`65ec358`)

- **Votações elegíveis** (ADR 0019): nominais de plenário, não secretas e de mérito. Mérito é reconhecido por uma lista fechada de começos da descrição oficial, por exemplo "Aprovado o Projeto de Lei nº…", "Aprovada, em segundo turno, a Proposta de Emenda à Constituição…" ou "Aprovado o Substitutivo ao…". Além disso, o resultado tem de bater com o campo oficial `aprovacao` e a proposição tem de ser identificada.
- **Medição:** amostra fixa de 120 votações nominais (30 por ano, sorteadas por hash do id), conferidas uma a uma. 23 eram de mérito, 96 de procedimento e 1 secreta, sem nenhum falso positivo. A primeira versão da regra teve 1 falso negativo (PEC 45/2019, 1º turno), corrigido com a busca na API. Resultado: **216 elegíveis de 1.128 nominais**. Fora ficaram 908 de procedimento, 3 secretas e 1 sem proposição identificável.
- Fontes novas, cada uma com esquema Zod e registro em `docs/FONTES.md`:
  - `votacoesProposicoes-{ano}`;
  - `deputados.json` com todas as legislaturas (nascimento e primeira legislatura);
  - busca de proposições na API, trimestre a trimestre: sem período, a API só devolve o que tramitou nos últimos 30 dias; com período, aceita no máximo 3 meses;
  - detalhe de proposição, para conferir projetos renumerados.
- Resumos opcionais em linguagem simples em `content/resumos/{id}.md`: só aparecem com `revisado: true`. A pasta tem um `LEIA-ME.md` e nenhum resumo.
- **Sorteio diário** (ADR 0020): HMAC com `EXTRAPOLAR_DAILY_SECRET`, ciclos sem repetição como no Chutaí. O pipeline publica hoje e os próximos 3 dias, embaralhados com a data, e guarda o estado em `jogos/sorteio.json`, que só cresce.
- Pacote `@extrapolar/games`: regras puras com 36 testes.
- Ilhas React (ADR 0021). Usei `@astrojs/react` **5.0.7**: a versão 7 puxa o Vite 8, que quebrou o build do Tailwind (`Missing field tsconfigPaths`).
- Página `/jogos` e página de transparência `/jogos/votacoes`, com as 216 votações e o resultado e links oficiais de cada uma.

### Etapa 2 — Dle do seu estado (`4bc2bb3`)

- Um deputado do dia por estado (27 sorteios). A escolha do estado fica salva no navegador.
- **Pistas:**
  - partido (amarelo = mesma federação);
  - condição (titular ou suplente);
  - "na Câmara desde" (ano da 1ª legislatura);
  - ano de nascimento (amarelo até 5 anos de diferença, com setas);
  - estado natal;
  - comissões em que é titular hoje (amarelo = alguma em comum);
  - projetos como autor principal (amarelo até 20% de diferença, com setas).
- Sem gênero, gastos, presença ou alinhamento: qualquer um deles poderia ser lido como nota.
- **Chutes:** 6 em estados com até 10 deputados, 8 até 30 e 10 acima disso. O autocompletar mostra só o estado e ignora acentos. A foto borrada é uma dica opcional.
- **Revelação:** "Edição extra", foto, link para a ficha, estatísticas, sequência e quadradinhos 🟩🟨🟥.

### Etapa 3 — Placar (`1d1f549`)

- Uma votação por dia, sorteada entre as elegíveis dos últimos 12 meses (60 hoje).
- **Pergunta 1:** maioria do estado entre Sim, Não e Empate, contando só os deputados em exercício. Acerto vale 50 pontos.
- **Pergunta 2:** porcentagem de Sim, num controle deslizante. Vale 100 − 2 × a diferença.
- **Revelação:** carimbo APROVADA/REJEITADA, placar oficial, votos do estado e quórum de PEC (308) e PLP (257).

### Etapa 4 — Vote você também (`53974b3`)

- **Rodada semanal:** as 10 votações elegíveis mais recentes antes da segunda-feira, uma por proposição, sem as quase unânimes (91 das 216 são).
- **Resultado:** "concordou em X de Y votações", primeiro com os deputados do estado e depois com todos. Base pequena (menos de 5) aparece com aviso e vai para o fim da lista, para "2 de 2" não ficar acima de "7 de 9". ⚠
- **Partidos:** concordância com a orientação, pela regra do ADR 0014 (partido, depois federação; bloco não).

### Etapa 5 — Seja deputado (`e2d8972`)

- A votação elegível mais recente pelo horário de registro (hoje, o PLP 281/2019, de 14/10/2026), sempre com a data em destaque.
- Depois do voto, o jogador vê:
  - carimbo e placar;
  - a nota do quórum;
  - "como a maioria / como a minoria do plenário";
  - quem votou o quê, com filtros por estado e partido e o partido da época quando era outro;
  - a orientação de cada partido.

### Etapa 6 — Monte seu ranking (`934e357`)

- Funções puras em `packages/metrics/src/ranking.ts`, com 14 testes: empates, sem dado, peso zero, uma métrica, direção invertida, filtro e URL.
- **Critérios:** as 21 métricas, cada uma com "O que é isso?" e link para a metodologia. Peso de 0 a 5 e direção não têm padrão: a métrica só entra quando os dois são escolhidos.
- **Cálculo:**
  - percentil entre os deputados com dado, na Câmara inteira (o filtro só escolhe quem aparece);
  - nota = média ponderada dos percentis;
  - barra e lista mostram quanto cada métrica somou;
  - "sem dado" fica numa lista à parte, com o motivo;
  - base pequena (menos de 30) aparece com aviso.
- Link compartilhável (`?m=participacao.3.mais,cota-total.2.menos&uf=SP&partido=PL`) e aviso permanente no topo. O ADR 0010 foi atualizado.

### Etapa 7 — Fechamento

- Workflow diário passa `EXTRAPOLAR_DAILY_SECRET` ao pipeline e avisa quando o segredo não existe.
- **Dias publicados não mudam:** percebi que os primeiros dias foram sorteados com a chave local, e que criar o segredo mudaria até o dia de hoje. O `sorteio.json` agora guarda os dias já publicados (últimos 30), e as execuções seguintes os reaproveitam. Isso está testado e registrado no ADR 0020.
- `pnpm check:a11y:jogos` (novo) preenche o estado "jogo terminado" e roda o axe na revelação e nos resultados. Ele achou contraste baixo no rótulo pequeno das peças vermelhas do Dle; corrigi tirando a transparência e escurecendo o vermelho no tema claro (`#b5321c`, 5,3:1).
- Capturas no celular e no computador, nos temas claro e escuro: sem rolagem lateral.
- README (com duas imagens novas), CLAUDE.md, ARQUITETURA e DESIGN atualizados.

## Decisões que tomei sozinho

As marcadas com ⚠ mudam números ou o que o leitor vê. Todas estão nos ADRs 0019–0021, no 0010 atualizado ou na metodologia.

- ⚠ Emendas do Senado a projetos da Câmara ficam fora dos jogos: são emendas isoladas, como pede o briefing, mesmo sendo a palavra final da Câmara sobre aquelas mudanças.
- ⚠ Projetos renumerados só valem quando a proposição ligada à votação é a única do mesmo tipo e foi apresentada no ano citado; o site mostra o número atual. Hoje são 6 casos; o PL 5.228/2019 (apensado) ficou fora.
- ⚠ Proposição citada achada várias vezes na API: vale a apresentada primeiro (a mesma PEC volta do Senado com outro id).
- ⚠ Votos individuais mostrados nos jogos: só dos deputados em exercício hoje (os que têm ficha). O placar é sempre o oficial completo, e a diferença é explicada na tela.
- ⚠ Placar: o sorteio usa as elegíveis dos últimos 12 meses ("recente"). A pergunta do estado vale 50 pontos e o placar até 100.
- ⚠ Vote você também: a rodada usa votações **anteriores à segunda-feira**, para não mudar no meio da semana. Se a votação mais recente de uma proposição é quase unânime, a proposição inteira fica fora (não volto a uma votação anterior dela). Abstenção, obstrução e Art. 17 do deputado não contam a favor nem contra. Base pequena vai para o fim da lista.
- ⚠ Dle: escolhi os atributos e os limites de "perto" e de chutes. "Na Câmara desde" usa a 1ª legislatura (1951 + 4 × (legislatura − 39)).
- ⚠ Ranking: percentil entre todos os deputados com dado (filtro não muda a escala); empate divide a posição, com ordem alfabética dentro do empate; mostra 50 por vez.
- ⚠ Textos sem gênero inventado: "Hoje a cadeira é sua" no lugar de "você é deputado"; "A ficha completa está a um clique" no lugar de "dele".
- O sorteio publica hoje e os próximos 3 dias e guarda os dias já publicados. Quem ler o código ou `sorteio.json` vê esses 4 dias (ADR 0020).
- O Dle usa um arquivo por estado (`/jogos/dados/dle-UF.json`) e o ranking um arquivo compacto (`/ranking/dados.json`, ~35 KB comprimido), baixados pela ilha. Os outros jogos recebem os dados como propriedades da ilha.
- `@astrojs/react` fixado em 5.0.x (Vite 7). A atualização para o Astro 7 / Vite 8 fica para quando o resto do site for junto.

## O que ficou de fora (e por quê)

| Item                                               | Situação                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Resumos em linguagem simples                       | Estrutura pronta, nenhum escrito (fora do escopo; trabalho manual) |
| "Aprovada ou rejeitada?" no Placar                 | Trocada pela maioria do estado (decidido no planejamento)          |
| Votações de comissões                              | Fora: só o plenário tem a Câmara inteira votando                   |
| Emendas do Senado, destaques, requerimentos        | Fora dos jogos (regra do briefing)                                 |
| Número de mandatos no Dle                          | Sem contagem oficial; usado "na Câmara desde"                      |
| Sorteio impossível de espiar                       | Exigiria servidor; o risco foi documentado (ADR 0020)              |
| Login, contas, salvar rankings em servidor, deploy | Fora do escopo da Fase 2                                           |

## TODOs que dependem de você

**Configurar**

- [ ] **Segredo do sorteio:** no GitHub, abra Settings → Secrets and variables → Actions → New repository secret, com o nome `EXTRAPOLAR_DAILY_SECRET` e um valor aleatório de pelo menos 16 caracteres (por exemplo, a saída de `openssl rand -hex 24`). Os dias já publicados não mudam (ADR 0020).
- [ ] `git push` dos commits (7 da Fase 2 + o fechamento da Fase 1), quando quiser.

**Decidir**

- [ ] Revisar os ADRs 0019, 0020 e 0021, a atualização do 0010 e as decisões ⚠ acima.
- [ ] Escrever os primeiros resumos em `content/resumos/` (o `LEIA-ME.md` explica o formato). Os ids estão em `/jogos/votacoes`.
- [ ] Crescimento do repositório (Fase 1): aceitar ou adotar uma das alternativas.
- [ ] Os TODOs das fases anteriores continuam (teto da cota, emendas sem ligação, licenças das fontes, Vercel); ver `RELATORIO-FASE1.md`.

## Medidas

- **Votações:** 1.128 nominais de plenário; 216 elegíveis (49 em 2023, 46 em 2024, 89 em 2025 e 32 em 2026); 91 quase unânimes; 2 rejeitadas.
- **Pipeline com cache:** ~1 minuto, igual à Fase 1. Os jogos acrescentam 4 arquivos anuais pequenos (4 a 8 MB cada), um arquivo de 3,6 MB e algumas dezenas de consultas à API (busca de proposições antigas), com cache de 30 dias.
- **Dados novos em `data/generated/jogos/`:** 33 arquivos. Por dia mudam `placar.json`, os 27 do Dle, `sorteio.json`, `meta.json` e, quando há votação nova, `votacoes.json`, `vote-voce.json` e `seja-deputado.json`.
- **Peso das páginas** (gzip): HTML dos jogos de 7 a 19 KB. O React fica num arquivo compartilhado de ~67 KB, carregado só em `/jogos/*` e `/ranking`; cada ilha tem de 3 a 5 KB. O ranking baixa ~35 KB de dados e cada estado do Dle de 1 a 3 KB. A ficha e a capa continuam sem React.
- **Testes:** 243 (shared 21, metrics 65, games 36, pipeline 105, web 16). Na Fase 1 eram 144.
- **Site:** 525 páginas e arquivos estáticos.

## Como testar

```bash
cd ~/Documents/Extrapolar
pnpm install

# Qualidade (o mesmo que o CI roda)
pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build

# Dados (gera também data/generated/jogos)
pnpm pipeline

# Site
pnpm build && pnpm --filter @extrapolar/web preview     # deixe rodando
# (se a porta 4321 estiver ocupada, o preview usa a 4322: prefixe os comandos com BASE_URL=http://localhost:4322)
pnpm check:a11y /jogos /jogos/dle /jogos/placar /jogos/vote-voce-tambem /jogos/seja-deputado /ranking
pnpm check:a11y:jogos
SCREENSHOT_MAX_HEIGHT=2500 pnpm screenshots /jogos /jogos/dle /ranking
```

**O que olhar no navegador**

- `/jogos`: os quatro cartões, com "Como jogar".
- `/jogos/dle`: escolha um estado e chute. Confira cores, setas, foto borrada, revelação e "Compartilhar" (o texto não traz o nome). Recarregar mantém o jogo do dia.
- `/jogos/placar`: responda as duas perguntas e confira o carimbo, o placar e a pergunta do estado.
- `/jogos/vote-voce-tambem`: vote nas 10 (pule algumas). Confira o estado em destaque, a base pequena e os partidos.
- `/jogos/seja-deputado`: o PLP 281/2019 (rejeitado com 252 × 176), a nota do quórum e os filtros.
- `/ranking`: comece vazio, marque métricas, pesos e direções e abra "Quanto cada métrica somou". Copie o link e abra numa aba anônima. Teste também `?m=alinhamento-partido.4.mais`, com 37 deputados na lista "sem dado".
- `/jogos/votacoes`: a lista das 216 votações, com os links oficiais.
- Edição noturna e celular (390 px); com "reduzir movimento" ligado, o carimbo não anima.
