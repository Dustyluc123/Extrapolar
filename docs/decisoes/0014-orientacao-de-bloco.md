# 0014 — Orientação de bancada: partido, depois federação; bloco não é usado

**Status:** aceito (22/10/2026) — decidido pelo Lucas no planejamento da Fase 1

## Contexto

Para o alinhamento com o partido, cada voto é comparado com a orientação da bancada do partido do deputado. Mas muitos partidos não orientam sozinhos: a orientação vem do **bloco parlamentar** de que fazem parte. Nos arquivos, o nome do bloco vem abreviado (`Bl UniPpPsd...`, `Bl PlFdrPtUniPp...`) e a API `/blocos` só lista os blocos atuais, sem datas; para blocos que não são federação, `/blocos/{id}/partidos` vem vazio. Não há forma oficial de saber quais partidos formavam um bloco numa data passada.

## Decisão

1. Vale a orientação do **próprio partido** (nome da bancada igual à sigla, sem acento; com os casos conferidos de abreviação e apelido: "Solidaried", "Republican", "Podemos" = PODE).
2. Se não houver, vale a da **federação** do partido, com a composição da API oficial (federações duram a legislatura inteira).
3. Orientação de **bloco não é usada**. A votação sai da conta e é contada à parte ("só o bloco orientou"), e a ficha mostra quantas ficaram de fora.
4. O partido considerado é o da **data da votação** (registrado no voto).

## Consequências

- ⚠ Deputados de partidos que quase só orientam pelo bloco (União, PP, MDB, Republicanos, Podemos) ficam com poucas votações comparáveis (14 a 41 em média, em 22/10/2026) e 37 ficam "sem dado". A metodologia explica isso como efeito da regra, não do comportamento do deputado.
- Se a Câmara passar a publicar a composição histórica dos blocos, dá para incluir as orientações de bloco sem mudar o resto.
