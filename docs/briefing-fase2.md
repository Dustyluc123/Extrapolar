# Briefing — Fase 2 do Extrapolar: jogos + "Monte seu ranking"

> Cole no Claude Code, em modo de planejamento, **aberto na pasta do Extrapolar**.
> Leia antes: `CLAUDE.md`, `docs/`, `docs/RELATORIO-FASE1.md` e `docs/PLANO-FASE1.md`.

---

A Fase 1 ficou impecável. Agora vamos fazer a parte que deixa o site divertido e pessoal: quatro jogos e a página onde cada pessoa monta o próprio ranking.

## 0. Como vamos trabalhar (igual à Fase 1)

1. **Planejamento:** leia tudo, apresente o plano em `docs/PLANO-FASE2.md` e faça **todas** as perguntas de uma vez, agora.
2. **Execução:** depois da aprovação, execute todas as etapas em sequência, **sem parar e sem perguntar**, com um commit por etapa.
3. Dúvida durante a execução: escolha a opção mais simples e conservadora, registre num ADR e siga. Decisões que mudam números ou o que o leitor vê ficam marcadas com ⚠ no relatório.
4. Pode ler e escrever fora da pasta do projeto quando precisar, mas **nunca** faça `git push`, nunca apague o que não criou e não mexa em configurações globais.
5. **Relatório final** em `docs/RELATORIO-FASE2.md`, no mesmo formato dos anteriores.
6. Se o `CLAUDE.md` tiver instruções sobre o Obsidian, siga-as ao final (nota-resumo da fase no vault).

Os princípios do `CLAUDE.md` continuam valendo: neutralidade, todo número verificável, nunca inventar dados, custo perto de zero (nada de servidor, banco ou serviço pago).

## 1. Etapa 0 — Terminar o fechamento da Fase 1

O limite de uso acabou durante a etapa 10 da Fase 1: a seção "Medidas" do `docs/RELATORIO-FASE1.md` ficou vazia ("preenchido no fechamento"). Antes de tudo:

- Confira `git status` e `git log` para ver o que ficou sem commit.
- Meça e preencha "Medidas" (tempo do pipeline com e sem cache, crescimento do repositório por execução).
- Conclua o que faltar da etapa 10 e faça o commit.

## 2. Base comum dos jogos

### Votações elegíveis

Três jogos usam votações reais. Crie no pipeline uma lista de **votações elegíveis**, com regras documentadas em `docs/METODOLOGIA.md`:

- Só votações **nominais de plenário** (as únicas com voto individual registrado). Votações secretas ficam fora.
- Só votações **de mérito**: a decisão sobre o conteúdo de uma proposição (texto principal de um PL, PLP, PEC, PDL, MPV etc.). Requerimentos de procedimento (urgência, adiamento, retirada de pauta), destaques e emendas isoladas ficam fora, porque são difíceis de explicar e o jogador não teria como entender o que está em jogo. Investigue nos dados (`votacoes`, `votacoesObjetos`, `votacoesProposicoes`, campo de descrição) como separar mérito de procedimento, meça numa amostra quantas você classifica certo e documente o método. Na dúvida, a votação fica fora.
- Cada votação elegível precisa de uma **descrição compreensível**. Nesta fase, **sem IA**: use a ementa oficial da proposição afetada, com sigla, número e ano, e um link para a página oficial. Se não houver proposição identificável, a votação fica fora.
- Estrutura preparada para **resumos em linguagem simples**: um arquivo opcional por votação (por exemplo, `content/resumos/{idVotacao}.md`) com o texto e o campo `revisado: true/false`. Os jogos usam o resumo só quando existir e estiver revisado; caso contrário, mostram a ementa. Não gere resumos nesta fase; eu vou escrever ou revisar à mão depois.
- Dados de cada votação no JSON do jogo: data, descrição, link oficial, resultado (aprovada ou rejeitada), placar (sim, não, abstenção, obstrução) e o voto de cada deputado (para revelar depois da jogada).

### Regras de neutralidade dos jogos

- Os jogos testam **conhecimento sobre o que aconteceu**, nunca opinião sobre quem está certo. Nenhum texto diz que um voto é bom ou ruim.
- Nada de jogos que comparam deputados entre si ("quem gastou mais"): isso é ranking disfarçado.
- **O voto do jogador é dele.** Escolhas nos jogos 3 e 4 ficam só no navegador (`localStorage`, com try/catch, como na Fase 0). Nada é enviado a lugar nenhum; diga isso na tela em uma frase.

### Infraestrutura dos jogos

- Página `/jogos` com os quatro jogos, cada um com "Como jogar" curto.
- Sorteio diário determinístico, igual para todo mundo, que muda à meia-noite de Brasília (o Chutaí em `~/Downloads/chutai` já tem essa lógica com HMAC e chave secreta; reaproveite a ideia, adaptando ao site estático: o JSON pode trazer a sequência do dia já calculada pelo pipeline, sem expor as respostas antes da hora — documente a escolha e o que um jogador curioso conseguiria ver no código-fonte).
- Sequência de dias, estatísticas e "compartilhar resultado" em quadradinhos ou emojis, **sem revelar a resposta**, como o desafio diário do Chutaí.
- Componentes interativos como ilhas React (como previsto no ADR 0001). O resto continua estático.
- Visual coerente com a Fase 1: estética de jornal, tom leve. Os jogos são uma ótima oportunidade para o lado menos sério (carimbos de "APROVADA"/"REJEITADA", manchete de "edição extra" na revelação, animações respeitando `prefers-reduced-motion`).

## 3. Os quatro jogos

### Jogo 1 — Dle do seu estado

Adivinhar o deputado do dia **entre os deputados do estado escolhido** (8 a 70 opções, em vez de 513). A missão é fazer a pessoa conhecer quem a representa.

- O jogador escolhe o estado (lembrar a escolha no navegador). Cada estado tem o seu deputado do dia.
- Cada chute compara atributos com o deputado secreto, no estilo do Chutaí: verde (igual), amarelo (perto ou em comum), vermelho (diferente), setas para números.
- Atributos: use só dados factuais que já temos e que ajudem a distinguir pessoas (por exemplo: partido, quantidade de mandatos ou primeiro mandato, comissões em comum, número de projetos como autor principal, ano de nascimento ou faixa etária). Escolha o conjunto, documente e **não use nenhum atributo que soe como julgamento**.
- A foto pode aparecer como recompensa na revelação ou como dica opcional (borrada, como o modo Imagem do Chutaí, se for simples fazer no build).
- Autocompletar só com os deputados daquele estado, ignorando acentos.
- Limite de chutes proporcional ao tamanho do estado (decida e documente).

### Jogo 2 — Placar

Uma votação elegível recente por dia. O jogador lê a descrição e responde:

1. Foi **aprovada ou rejeitada**?
2. **Qual foi o placar?** (por faixas ou um controle deslizante para a porcentagem de "sim"; escolha o que for mais divertido no celular).

Revelação: resultado, placar real, gráfico simples dos votos e link para a votação oficial. Pontuação pela proximidade do placar.

### Jogo 3 — Vote você também

Uma rodada com **10 votações elegíveis** (as mais recentes, ou uma seleção semanal; decida e documente). O jogador vota Sim ou Não em cada uma (com opção de pular).

No fim, mostra **com quais deputados ele concordou mais vezes**: concordância = votos iguais ÷ votações em que os dois votaram. Regras:

- Apresente como "concordou em X de Y votações", nunca como "seu deputado ideal" ou recomendação de voto.
- Mostre os deputados do estado do jogador em destaque e a lista geral depois.
- Deputados que votaram em poucas das 10 votações aparecem com aviso de base pequena, como no resto do site.
- Mostre também a concordância com a orientação de cada partido, se os dados permitirem com a mesma regra do ADR 0014.
- Link de cada deputado para a ficha dele.

### Jogo 4 — Seja deputado

A votação elegível **mais recente** que o site tem (a da última atualização dos dados). O jogador vota Sim ou Não e depois vê:

- se a proposta foi aprovada ou rejeitada;
- o placar;
- **quem votou Sim e quem votou Não**, com filtro por estado e partido, e o voto dos deputados do estado do jogador em destaque;
- link para a ficha de cada deputado.

Diferença para o jogo 3: aqui é uma votação só, a mais recente, como uma "notícia do dia" em forma de jogo. Se não houver votação elegível nova desde a última atualização, mostre a mais recente com a data em destaque.

## 4. Monte seu ranking

Página `/ranking`. É a única parte do site que ordena deputados, e quem define os critérios é o usuário. Atualize o ADR 0010 para registrar essa exceção (a ficha continua sem comparação).

- **Escolha das métricas:** o usuário escolhe quais métricas entram (a partir do `metricas.json` da Fase 1), com o nome e o "O que é isso?" de cada uma visível.
- **Peso de cada métrica:** de 0 a 5 (ou algo equivalente e simples no celular).
- **Direção de cada métrica:** o usuário marca se "mais é melhor" ou "menos é melhor". O site **não** decide por ele (gastar menos cota, alinhar mais com o partido, apresentar mais projetos: tudo isso é escolha do usuário).
- **Sem pesos nem direções padrão:** começa vazio, com uma explicação curta de como montar. Nada de "ranking recomendado".
- **Normalização:** converta cada métrica em percentil entre os deputados com dado, para que reais e porcentagens possam ser combinados. Documente a fórmula na metodologia.
- **"Sem dado" não é zero:** deputados sem dado em alguma métrica escolhida ficam fora da classificação e aparecem numa lista à parte, com o motivo. Métricas com base pequena (< 30) recebem o aviso de sempre.
- **Filtros:** estado e partido.
- **Transparência do resultado:** cada posição mostra quanto cada métrica contribuiu para a nota (barra empilhada ou lista simples), com link para a ficha.
- **Link compartilhável:** métricas, pesos, direções e filtros na URL ("veja o meu ranking").
- **Aviso permanente no topo:** este ranking reflete os critérios de quem o montou, não uma avaliação do Extrapolar.
- Tudo calculado no navegador, sem servidor. Se o `metricas.json` estiver grande para o celular, gere uma versão compacta só para o ranking.
- Funções de normalização e pontuação puras, em `packages/metrics`, com testes (empates, sem dado, peso zero, uma métrica só, direção invertida).

## 5. Critério de pronto da Fase 2

- Fechamento da Fase 1 concluído (Etapa 0).
- `/jogos` com os quatro jogos funcionando no celular e no computador, nos temas claro e noturno, com "Como jogar", sequência e compartilhamento sem spoiler.
- Votações elegíveis com método documentado e medido numa amostra.
- `/ranking` com escolha de métricas, pesos, direções, filtros, contribuição por métrica e link compartilhável.
- Funções puras testadas para jogos (comparação de atributos, pontuação do placar, concordância) e para o ranking.
- `pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build` passam; `pnpm check:a11y` sem violações em `/jogos`, em cada jogo e em `/ranking`; capturas de celular sem rolagem horizontal.
- Workflow diário atualizado para gerar os dados dos jogos.
- `docs/RELATORIO-FASE2.md` completo.

**Fora do escopo:** resumos de votações gerados por IA, login, contas de usuário, salvar rankings em servidor, deploy.
