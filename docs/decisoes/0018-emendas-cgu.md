# 0018 — Emendas: download em lote da CGU, orçamentos de 2024 em diante e ligação estrita por nome

**Status:** aceito (22/10/2026) — período decidido pelo Lucas; demais pontos decididos na execução

## Contexto

As emendas estão no Portal da Transparência (CGU), que oferece download em lote sem chave (zip de ~33 MB com três CSVs, em ISO-8859-1, valores com vírgula decimal). O autor vem com nome e código do sistema de orçamento, não com o id da Câmara.

## Decisão

- **Fonte:** download em lote (`download-de-dados/emendas-parlamentares/UNICO`), só o arquivo `EmendasParlamentares.csv`. A API com token não é necessária.
- **Período** (decidido pelo Lucas): orçamentos de 2024 a 2027 (apresentados neste mandato).
- **Só emendas individuais:** bancada, comissão e relator não pertencem a um deputado.
- ⚠ **Ligação estrita:** nome normalizado igual e único dos dois lados, considerando todos os anos da base. Um deputado que aparece com o mesmo nome em dois códigos (por exemplo, como senador antes e como deputado agora) fica **sem ligação** até conferência manual em `packages/shared/src/config/emendas-autores.ts`. Autor identificado sem emenda no período = zero; não identificado = "sem dado".
- ⚠ **Execução** = (pago + restos a pagar pagos) ÷ empenhado, para contar os pagamentos feitos nos anos seguintes.

## Consequências

- Em 22/10/2026: 494 deputados ligados; 19 sem ligação (12 com dois códigos para o mesmo nome, 7 sem autor com o mesmo nome). A lista com os códigos candidatos está em `docs/RELATORIO-FASE1.md`.
- 142 autores de emendas individuais de 2024 em diante não correspondem a deputado atual (senadores, ex-deputados e os 12 casos ambíguos); a lista também está no relatório.
