# Plano — Fase 2: jogos + "Monte seu ranking"

Base: `prompt-ct-fase2.md` (vai para `docs/briefing-fase2.md` na etapa 1), `CLAUDE.md`, `docs/`, `docs/RELATORIO-FASE1.md` e `docs/PLANO-FASE1.md`.

> Observação: o projeto agora está em `~/Documents/Extrapolar` e o Chutaí em `~/Documents/chutai` (o briefing e o relatório da Fase 1 ainda citam `~/Downloads`). Os caminhos nos documentos serão corrigidos na etapa 0.

## O que já conferi (reconhecimento de 22/10/2026, só leitura)

### Estado do repositório

- `main` está 9 commits à frente de `origin/main` (nada foi enviado). A etapa 10 da Fase 1 **não tem commit**: estão modificados `.github/workflows/pipeline.yml`, `CLAUDE.md`, `README.md`, `docs/ARQUITETURA.md`, `docs/RELATORIO-FASE1.md`, 4 imagens do README e ~510 arquivos de `data/generated/` (resultado da última execução do pipeline).
- `docs/RELATORIO-FASE1.md` tem **duas** seções "Medidas": uma com os números da Fase 0 e outra vazia ("preenchido no fechamento").
- O `CLAUDE.md` ganhou no fim o modelo da seção do Obsidian **colado como está**: com o título "Trecho para colar no CLAUDE.md de cada projeto", o marcador `NOME_DO_PROJETO` e as instruções de como liberar o acesso ao vault. A pasta no vault é `01-Projetos/Extrapolar/` (com `Extrapolar.md`, `Sessões/`, `Decisões/`, `Ideias/`).

### Votações: como separar mérito de procedimento

Arquivos novos conferidos (2026): `votacoesProposicoes-{ano}.json` (4 MB; liga cada votação às proposições afetadas, **já com sigla, número, ano e ementa**) e `votacoesObjetos-{ano}.json` (21 MB; traz pareceres e outros objetos — não é necessário). O arquivo de votações que o pipeline já baixa tem `aprovacao` (0/1), a `descricao` do resultado e a `ultimaAberturaVotacao`.

Nas votações nominais de plenário, a `descricao` segue um padrão estável:

| Tipo                      | Exemplo de `descricao`                                                                                             | Elegível? |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------- |
| Mérito                    | "Aprovado o Projeto de Lei nº 6.139, de 2023…", "Aprovada, em segundo turno, a Proposta de Emenda à Constituição…" | sim       |
| Mérito (texto do relator) | "Aprovado o Substitutivo ao Projeto de Lei Complementar nº 14…", "Aprovada a Subemenda Substitutiva Global ao…"    | sim       |
| Mérito (MPV)              | "Aprovada a Medida Provisória nº 1.313 de 2025, na forma do Projeto de Lei de Conversão…"                          | sim       |
| Procedimento              | "Aprovado o Requerimento de Urgência…", "Rejeitado o Requerimento.", "Rejeitado o Recurso nº 2…"                   | não       |
| Destaque / emenda         | "Mantido o texto.", "Rejeitada a Emenda de Plenário nº 2.", "Aprovada a preferência.", "Resultado."                | não       |

Uma regra pelo início da descrição, testada em 2026, separou as 126 votações nominais de plenário sem nenhum erro visível na leitura (33 de mérito). Na legislatura inteira: **217 de mérito** em 1.128 nominais (2023: 50; 2024: 45; 2025: 89; 2026: 33, a última em 14/10/2026).

Três achados que mudam o desenho dos jogos:

1. **Quase tudo é aprovado.** Das 217 votações de mérito, **só 2 foram rejeitadas**. A pergunta "aprovada ou rejeitada?" do jogo Placar teria quase sempre a mesma resposta (ver pergunta 1).
2. **"Aprovada" não é "mais Sim do que Não".** Ex.: PLP 281/2019 em 14/10/2026 teve 252 Sim × 176 Não e foi **rejeitado** (projeto de lei complementar precisa de 257 votos; PEC, de 308). O resultado vem do campo oficial `aprovacao`, nunca deduzido do placar. Isso vira uma explicação na revelação ("Por que perdeu com mais Sim?").
3. **Votação de uma proposição diferente da "dona" da votação:** às vezes a proposição ligada é uma mensagem (MSC 112/2026) e o que foi votado é o PDL 50/2026 citado na descrição. Regra: a proposição usada é a que a descrição cita (sigla, número e ano), procurada em `votacoesProposicoes` e, se não estiver lá, nos arquivos `proposicoes-{ano}` que o pipeline já lê. Não achou: a votação fica fora.

Votações secretas (ex.: indicação ao TCU, 02/09/2026) ficam fora: não há voto individual.

### Dados para o "Dle do seu estado"

O arquivo estático oficial `arquivos/deputados/json/deputados.json` (3,6 MB, todos os deputados da história) tem `dataNascimento`, `ufNascimento`, `municipioNascimento` e `idLegislaturaInicial` para os 648 deputados da 57ª legislatura (100% preenchidos). Com isso dá para ter "ano de nascimento" e "na Câmara desde" sem chamar a API. Não há contagem oficial de mandatos (só a primeira e a última legislatura), por isso uso "na Câmara desde" e não "número de mandatos".

### Chutaí

`packages/game/src/daily.ts` (sorteio por ciclos sem repetição, ordem por HMAC com chave secreta, data pela meia-noite de Brasília, personagem novo só entra no ciclo seguinte), `compare.ts` (verde/amarelo/vermelho e setas) e `apps/web/src/lib/daily/share.ts` (quadradinhos). Vou copiar e adaptar a lógica, sem dependência entre os projetos.

### Ranking

`metricas.json` tem 21 métricas e 840 KB. Uma versão compacta só com os valores (por métrica, um vetor na ordem dos deputados) fica em torno de 60 KB antes da compressão.

## Decisões técnicas (vão para ADRs)

- **0019 — Votações elegíveis.** Nominal de plenário + não secreta + descrição de mérito (regra acima, com lista fechada de padrões) + proposição identificada do tipo PL, PLP, PEC, PDL, MPV/PLV ou PRC. Na dúvida, fica fora. Medição: amostra de 120 votações nominais (30 por ano, sorteio fixo) classificadas à mão por mim lendo a descrição e a abertura; relatório com acertos, falsos positivos e falsos negativos em `docs/METODOLOGIA.md`. Uma votação por linha em `data/generated/jogos/votacoes.json`: id, data, descrição (ementa + "PL 6.139/2023"), link oficial, `aprovacao`, placar oficial (sim, não, abstenção, obstrução, total), turno quando houver, e se existe resumo revisado.
- **Resumos em linguagem simples:** `content/resumos/{idVotacao}.md` com frontmatter (`revisado: true|false`, `autor`, `data`). O pipeline valida com Zod e só publica o texto se `revisado: true`. Pasta criada com um `LEIA-ME.md` e nenhum resumo.
- **0020 — Sorteio diário num site estático.** O pipeline (que roda às 6h de Brasília) calcula o sorteio de **hoje e dos próximos 3 dias** (folga se uma execução falhar) com HMAC e a chave secreta `EXTRAPOLAR_DAILY_SECRET` (segredo do GitHub Actions; sem ela, localmente, usa uma chave fixa e avisa no log). O JSON publica as respostas desses 4 dias **embaralhadas** (XOR com a data + base64), só para não aparecerem num olhar casual. O que um jogador curioso consegue: abrindo o código e o JSON, descobrir a resposta de hoje e dos próximos 3 dias; **não** consegue prever dias mais distantes. Ciclos sem repetição como no Chutaí; a lista de sorteáveis (com a data de entrada) fica em `data/generated/jogos/sorteio.json` e só cresce, para o sorteio passado nunca mudar.
- **0021 — Ilhas React nos jogos e no ranking.** `@astrojs/react` com `client:visible`; resto do site sem JS de framework. Estado do jogador em `localStorage` (`extrapolar:jogos:*`), sempre com try/catch. Nada sai do navegador; frase fixa em cada jogo: "Suas respostas ficam só neste aparelho. Nada é enviado."
- **Funções puras dos jogos em `packages/games`** (novo pacote, mesmo padrão dos outros: sem rede, sem disco, sem `Date.now()`): data do dia em Brasília, sorteio por ciclos, comparação de atributos, pontuação do placar, concordância, sequência e texto de compartilhar. Funções do ranking em `packages/metrics/src/ranking.ts` (percentil, nota, contribuição), como pede o briefing.
- **Dados dos jogos** em `data/generated/jogos/`: `votacoes.json` (elegíveis, sem votos individuais), `placar.json` (dias sorteados), `dle/{UF}.json` (atributos dos deputados do estado + dias sorteados), `vote-voce.json` (as 10 votações da rodada + voto de cada deputado em exercício em formato compacto + orientação de cada partido) e `seja-deputado.json` (a mais recente + votos). Os votos individuais mostrados são só dos **deputados em exercício** (os que têm ficha); o placar é sempre o oficial completo, e a diferença é explicada na tela.
- **0010 atualizado:** `/ranking` é a única exceção ao "sem ordenação"; os critérios são sempre do usuário; a ficha continua sem comparação.

### Regras que vou seguir (sem perguntar, salvo objeção)

- **Dle — atributos:** partido (amarelo = mesma federação), condição (titular/suplente), na Câmara desde (ano da primeira legislatura; setas), ano de nascimento (setas; amarelo até 5 anos de diferença), estado de nascimento (verde/vermelho), comissões como titular hoje (verde = mesmo conjunto, amarelo = alguma em comum), projetos como autor principal (setas; amarelo até 20% de diferença). Sem gênero, sem gastos, sem presença ou alinhamento (soariam como nota).
- **Dle — chutes:** 6 para estados com até 10 deputados, 8 até 30, 10 acima de 30. Foto borrada em CSS como dica opcional (fica nítida na revelação). Autocompletar só com o estado, ignorando acentos.
- **Placar:** controle deslizante da porcentagem de Sim entre os votos Sim + Não; pontos de 0 a 100 pela distância (100 − 2 × diferença em pontos percentuais, mínimo 0). Sorteio entre as elegíveis dos últimos 12 meses.
- **Vote você também — concordância:** só contam votações em que o deputado votou Sim ou Não (abstenção, obstrução e Art. 17 aparecem à parte, sem contar como concordo/discordo). Base pequena: menos de 5 das 10 votações. Partidos: orientação Sim/Não do próprio partido, depois da federação, bloco não (ADR 0014); "liberado" e sem orientação ficam fora.
- **Ranking:** percentil com empates pela média (`(abaixo + 0,5 × empatados) ÷ n`), "menos é melhor" = 1 − percentil, nota = soma de peso × percentil ÷ soma dos pesos, de 0 a 100. Pesos de 0 a 5 (botões, não slider). URL: `?m=participacao.3.mais,cota-total.2.menos&uf=SP&partido=PL`.
- **Visual:** carimbo "APROVADA"/"REJEITADA", manchete de "Edição extra" na revelação, quadradinhos sem a resposta, animações desligadas em `prefers-reduced-motion`.

## Etapas (um commit por etapa, sem parar)

0. **Fechamento da Fase 1.** Medir o pipeline com cache e sem cache (`--refresh`, ~15 min com discursos) e o crescimento do repositório; preencher "Medidas" (juntando as duas seções); corrigir caminhos `~/Downloads`; arrumar a seção do Obsidian no `CLAUDE.md` (pergunta 4); rodar a verificação completa; commit "Fase 1, etapa 10: fechamento".
1. **Base dos jogos.** Briefing em `docs/briefing-fase2.md`; ADRs 0019–0021 e 0010; pacote `packages/games`; fonte nova `votacoesProposicoes` e `deputados.json` estático (esquemas Zod, `docs/FONTES.md`); classificação das votações elegíveis + medição na amostra + seção na metodologia; `content/resumos/`; `@astrojs/react`; página `/jogos` com os quatro cartões e "Como jogar"; base comum (dia de Brasília, sequência, estatísticas, compartilhar, aviso de privacidade).
2. **Jogo 1 — Dle do seu estado.**
3. **Jogo 2 — Placar.**
4. **Jogo 3 — Vote você também.**
5. **Jogo 4 — Seja deputado.**
6. **Monte seu ranking** (`/ranking`, `ranking.json` compacto, funções puras com testes de empate, sem dado, peso zero, uma métrica e direção invertida).
7. **Fechamento.** Workflow diário com os dados dos jogos (e o segredo do sorteio); format, lint, neutralidade, tipos, testes, build; `check:a11y` em `/jogos`, cada jogo e `/ranking`; capturas de celular e desktop nos dois temas sem rolagem lateral; README, CLAUDE.md, ARQUITETURA, DESIGN; `docs/RELATORIO-FASE2.md`; nota da fase no vault (`01-Projetos/Extrapolar/Sessões/`) e atualização de `Extrapolar.md`.

Cada jogo (etapas 2 a 5) entra com: funções puras testadas, dados gerados pelo pipeline com esquema Zod de saída, ilha React, "Como jogar", sequência e compartilhamento, e texto passado na varredura de neutralidade.

## Perguntas

Feitas todas de uma vez no planejamento; as respostas ficam registradas aqui.

1. **Placar — "aprovada ou rejeitada?"** quase sempre é "aprovada" (215 de 217). Manter, trocar ou tirar a pergunta?
2. **Vote você também — quais 10 votações?** Rodada semanal (troca na segunda-feira) com as 10 mais recentes, uma por proposição (a última votação de mérito de cada uma); com ou sem tirar as quase unânimes (em que o lado menor teve menos de 10% dos votos Sim + Não), que quase não diferenciam ninguém?
3. **Sorteio diário:** criar o segredo `EXTRAPOLAR_DAILY_SECRET` no GitHub (você cria; eu deixo o workflow pronto e o passo a passo no relatório) ou usar uma semente pública (mais simples; quem ler o código consegue prever todos os dias)?
4. **`CLAUDE.md`:** a seção do Obsidian foi colada como modelo (com `NOME_DO_PROJETO` e as instruções de instalação). Posso deixá-la limpa, só com as regras do Extrapolar, e tirar o trecho "Liberar o acesso ao vault"?

## Respostas às perguntas (22/10/2026)

1. **Placar:** a primeira pergunta passa a ser "Como votou a maioria dos deputados do seu estado?" (estado escolhido pelo jogador, o mesmo do Dle). A revelação mostra se a proposta foi aprovada ou rejeitada e explica o quórum quando o resultado não segue a maioria simples.
2. **Vote você também:** rodada semanal (troca na segunda-feira) com as 10 votações de mérito mais recentes, uma por proposição, **sem as quase unânimes** (lado menor com menos de 10% dos votos Sim + Não). Critério documentado na metodologia.
3. **Sorteio:** HMAC com o segredo `EXTRAPOLAR_DAILY_SECRET` no GitHub Actions (o Lucas cria; passo a passo no relatório). Sem o segredo, o pipeline usa uma chave local fixa e avisa no log.
4. **`CLAUDE.md`:** limpar a seção do Obsidian (pasta `01-Projetos/Extrapolar/`, sem o título "Trecho para colar" e sem "Liberar o acesso ao vault").
