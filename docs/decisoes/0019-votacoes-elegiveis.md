# 0019 — Votações elegíveis para os jogos

**Status:** aceito (22/10/2026) — Fase 2, regras do briefing; método e medição decididos na execução

## Contexto

Três jogos (Placar, Vote você também, Seja deputado) mostram votações reais e o voto de cada deputado. O jogador precisa entender o que estava em jogo. A maior parte das votações nominais do plenário é de procedimento (urgência, adiamento, retirada de pauta, destaques, emendas isoladas), difícil de explicar. Os arquivos da Câmara não têm um campo "mérito × procedimento".

## Decisão

Uma votação é **elegível** quando:

1. É **nominal de plenário** (`siglaOrgao = "PLEN"` com votos individuais — ADR 0007) e **não é secreta** (ADR 0008).
2. A **descrição oficial do resultado** começa com um padrão de **mérito**, de uma lista fechada: "Aprovado/Rejeitado [, em primeiro/segundo turno,] o/a" + Projeto de Lei (Complementar, de Conversão), Projeto de Decreto Legislativo, Projeto de Resolução, Proposta de Emenda à Constituição, Medida Provisória, Substitutivo (inclusive o do Senado e o reformulado), Subemenda Substitutiva (Global), Emenda Substitutiva Global ou Emenda Aglutinativa Substitutiva. Todo o resto fica fora: requerimentos, recursos, destaques ("Mantido o texto"), emendas isoladas (inclusive emendas do Senado), preferência, parecer, redação final e "Resultado".
3. O resultado do texto bate com o campo oficial `aprovacao` (1/0). Sem o campo, ou se não bater, fica fora.
4. A **proposição** é identificada: a citada na descrição (sigla, número e ano), procurada nas proposições ligadas à votação (`votacoesProposicoes-{ano}.json`), depois nos arquivos anuais de proposições da legislatura e, por fim, na API (`/proposicoes?siglaTipo=&numero=&ano=`, trimestre a trimestre do ano citado, porque sem período a API só devolve o que tramitou nos últimos 30 dias e com período aceita no máximo 3 meses; se vierem várias, vale a apresentada primeiro — a mesma PEC volta do Senado com outro id). **Renumeradas:** a Câmara deu número novo a projetos antigos (o "PL 6.385/2016" citado na descrição é hoje o PL 2.721/2023). Se o número citado não existe mais, vale a proposição ligada à votação só quando ela é a única do mesmo tipo e foi apresentada no ano citado (conferido na API); o site mostra o número atual. Sem proposição citada, só vale se houver exatamente uma ligada de tipo de mérito. O tipo tem de ser PL, PLP, PEC, PDL (ou o antigo PDC), MPV, PLV ou PRC, e a ementa não pode estar vazia.

**Descrição mostrada:** a ementa oficial, com sigla, número e ano e link para a página da proposição. Resumos em linguagem simples ficam em `content/resumos/{idVotacao}.md` e só aparecem com `revisado: true` (escritos ou revisados à mão; sem IA nesta fase).

**Resultado:** sempre o campo oficial. "Aprovada" não é "mais Sim que Não": projeto de lei complementar precisa de 257 votos Sim e PEC de 308 (ex.: PLP 281/2019, 252 × 176, rejeitado).

## Medição

Amostra fixa de 120 votações nominais de plenário (30 por ano, de 2023 a 2026, sorteio por hash do id), conferidas uma a uma lendo a descrição e a abertura da votação: nenhum falso positivo; um falso negativo na primeira versão da regra (PEC 45/2019, 1º turno — proposição citada sem ligação direta), corrigido com a busca na API. Na legislatura, até 22/10/2026: 216 elegíveis de 1.128 nominais (908 de procedimento, 3 secretas, 1 sem proposição identificável — PL 5.228/2019, apensado, cujo número citado não corresponde à proposição ligada). Detalhes em `docs/METODOLOGIA.md#votacoes-dos-jogos`.

## Consequências

- ⚠ Emendas do Senado a projetos da Câmara ficam fora, mesmo sendo a palavra final da Câmara sobre aquelas mudanças: são emendas isoladas, como pede o briefing.
- ⚠ Quase todas as votações de mérito são aprovadas (2 rejeitadas em mais de 200 na legislatura). Por isso o Placar pergunta como votou a maioria do estado, e não "aprovada ou rejeitada?" (decidido pelo Lucas no planejamento).
- Se a Câmara mudar o texto das descrições, votações de mérito podem deixar de ser reconhecidas (ficam fora, nunca entram erradas). O pipeline registra quantas ficaram fora por motivo em `jogos/votacoes.json`.
