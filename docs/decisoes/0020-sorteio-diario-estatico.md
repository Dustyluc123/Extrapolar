# 0020 — Sorteio diário num site estático

**Status:** aceito (22/10/2026) — Fase 2; segredo no GitHub decidido pelo Lucas no planejamento

## Contexto

O Dle e o Placar têm um desafio por dia, igual para todo mundo, que vira à meia-noite de Brasília. O Chutaí faz isso num servidor, com HMAC e chave secreta. O Extrapolar não tem servidor: o site é HTML estático, refeito uma vez por dia (pipeline às 6h de Brasília). O jogo precisa das respostas no navegador para comparar os chutes.

## Decisão

- **Ordem dos dias:** ciclos sem repetição, como no Chutaí (`packages/games/src/draw.ts`). A ordem de cada ciclo é um HMAC-SHA256 com a chave `EXTRAPOLAR_DAILY_SECRET` (segredo do GitHub Actions). Sem a chave (desenvolvimento local), o pipeline usa uma chave fixa e avisa no log.
- **Listas que só crescem:** o estado do sorteio fica em `data/generated/jogos/sorteio.json`. Item novo (deputado que assumiu, votação nova) entra com a data do dia e só aparece no ciclo seguinte; item que saiu continua na lista (se for sorteado, vale o próximo disponível). Assim os dias já sorteados não mudam.
- **Janela publicada:** o pipeline publica o sorteio de **hoje e dos próximos 3 dias** (folga se uma execução falhar). Cada dia vai **embaralhado com a própria data** (XOR + base64), só para a resposta não aparecer num olhar casual.
- **Virada do dia:** o navegador calcula a data de Brasília (`Intl`, fuso `America/Sao_Paulo`) e abre o dia correspondente. Se o site estiver desatualizado há mais de 3 dias, o jogo avisa que o desafio do dia ainda não saiu.
- **Lançamento:** o desafio #1 é o dia da primeira execução do pipeline com os jogos (`launchDate` no `sorteio.json`).

## O que um jogador curioso consegue ver

Abrindo o código-fonte da página e o JavaScript, dá para desembaralhar e descobrir a resposta de **hoje e dos próximos 3 dias**. Não dá para prever os dias seguintes sem a chave. Como não há prêmio nem placar entre jogadores, o risco é aceitável; esconder de verdade exigiria um servidor.

## Consequências

- Custo zero; nada roda fora do build e do pipeline.
- Trocar a chave muda a ordem dos ciclos futuros; os dias já publicados no Git continuam como foram.
- TODO (Lucas): criar o segredo `EXTRAPOLAR_DAILY_SECRET` no GitHub (Settings → Secrets and variables → Actions), com pelo menos 16 caracteres aleatórios.
