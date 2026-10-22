# 0017 — Teto da cota parlamentar: só onde há tabela oficial

**Status:** aceito (22/10/2026) — opção aprovada pelo Lucas no planejamento; aplicação decidida na execução

## Contexto

O teto mensal da cota varia por UF e foi reajustado pelo Ato da Mesa nº 244/2026 (em vigor desde 20/02/2026), que corrige o Anexo Único do Ato da Mesa nº 43/2009 pelo IPCA de fevereiro de 2023 a dezembro de 2025. O texto HTML do ato não traz a tabela (ela está no Diário da Câmara de 20/02/2026, p. 2216, que não conseguimos acessar). A página oficial "Cota Parlamentar" (guia para jornalistas) traz a tabela das 27 UFs como "valores atuais", sem data. A tabela vigente de fevereiro de 2023 a fevereiro de 2026 não foi encontrada.

## Decisão

- ⚠ Março de 2026 em diante: valores da página oficial "Cota Parlamentar" (conferida em 22/10/2026), com o Ato 244/2026 como base legal. TODO: conferir no Diário da Câmara.
- ⚠ Fevereiro de 2023 a fevereiro de 2026: `null` (sem tabela oficial). Fevereiro de 2026 também, porque o ato entrou em vigor no dia 20.
- ⚠ A proporção do teto usa só meses com teto oficial, em exercício e já encerrados (o mês corrente fica fora).

## Consequências

- Em 2026, a ficha mostra a proporção do teto de março até o mês anterior à atualização; nos outros anos, só os valores gastos.
- Quando a tabela de 2023 for encontrada, basta preencher o período em `packages/shared/src/config/ceap-tetos.ts`.
