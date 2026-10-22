# 0007 — Definição da métrica de participação

**Status:** aceito (22/10/2026)

## Contexto

O briefing pede participação em votações nominais de plenário na legislatura atual. Faltava definir o que conta como "participou", qual é o denominador e como identificar uma votação nominal nos dados.

## Decisão

- **Votação nominal de plenário:** votação com `siglaOrgao = "PLEN"` que tem ao menos um voto individual no arquivo `votacoesVotos-{ano}.json`. (Conferido em 2023: o arquivo de votos só traz votações nominais; as 300 de plenário com votos são exatamente as que têm contagem maior que zero.)
- **Participou** (decidido pelo Lucas): qualquer voto registrado — Sim, Não, Abstenção, Obstrução e Artigo 17. Obstrução e Artigo 17 aparecem separados na ficha.
- **Denominador** (decidido pelo Lucas): só as votações em que o deputado estava em exercício, segundo o histórico oficial (`/deputados/{id}/historico`).
- **Períodos em exercício:** eventos da legislatura em ordem de `dataHora`; situação "Exercício" abre um período; qualquer outra situação (Licença, Suplência, Convocado, Suspenso, Fim de Mandato…) fecha; situação vazia (troca de nome ou partido) é ignorada. Situações são comparadas sem acento e sem diferença de maiúsculas. Em empate de horário, eventos que fecham vêm antes dos que abrem. Período aberto vai até a data de referência (data da geração), limitada ao fim da legislatura.
- **Voto fora do período:** se o deputado votou numa votação fora dos períodos montados, ela entra no denominador e no numerador (se votou, estava em exercício). O pipeline registra quantos casos assim aconteceram.
- **Sem votações elegíveis:** taxa `null` ("sem dado"), nunca 0%.
- **Comparação de horários:** todos os horários da Câmara são de Brasília e sem fuso; são comparados como texto ISO (`AAAA-MM-DDTHH:mm:ss`), sem conversão de fuso.

## Consequências

- Licenciados e suplentes não são cobrados por votações em que não podiam votar.
- Quem tem poucas votações elegíveis pode ter porcentagem instável; a ficha sempre mostra o número de votações.
- Depende da qualidade do histórico da Câmara; inconsistências ficam registradas no `meta.json`.
