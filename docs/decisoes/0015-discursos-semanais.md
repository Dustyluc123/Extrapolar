# 0015 — Discursos: API com atualização semanal e coleta tolerante a falhas pontuais

**Status:** aceito (22/10/2026) — decidido durante a execução da Fase 1

## Contexto

Não há arquivo estático de discursos (`discursos-{ano}.json` não existe); só a API `/deputados/{id}/discursos`. Medido em 22/10/2026: cerca de 1,5 s por página de 100 discursos, até 3 páginas por deputado, ~4 KB por discurso (a resposta inclui a transcrição completa). Para 513 deputados, uma coleta completa faz cerca de 800 requisições (vários minutos). Além disso, a API devolve **erro 500 persistente** para alguns períodos de alguns deputados (exemplo: deputado 204528, qualquer consulta que inclua 2026), enquanto os outros períodos funcionam.

## Decisão

- **Atualização semanal:** o resultado de cada deputado fica em cache por 7 dias (`data/raw/api/discursos/{id}.json`); o pipeline diário reaproveita o cache, e a cada 7 dias a coleta é refeita. A ficha mostra a data da consulta e diz que o dado é semanal.
- **Cache reduzido:** guarda só data, fase e tipo de cada discurso — nunca a transcrição nem o resumo (ADR 0016).
- **Falha pontual da API:** tenta a legislatura inteira; se falhar, divide em anos; se um ano falhar, divide em meses; o mês que ainda falhar fica registrado como **indisponível** (aparece na ficha e no aviso de qualidade). Mudança de formato (erro de validação Zod) continua derrubando o pipeline.
- **Falha geral da API:** se a coleta de um deputado falhar e houver cache antigo, usa o antigo com aviso.
- Cliente HTTP com 2 novas tentativas (em vez de 5) só para discursos, para erros persistentes não custarem 31 s cada.

## Consequências

- A primeira execução sem cache leva alguns minutos a mais; as diárias, segundos.
- Os números de discursos podem estar até 7 dias atrasados em relação às outras métricas.
