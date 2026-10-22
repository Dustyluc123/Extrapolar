# 0016 — A ficha não reproduz o conteúdo dos discursos

**Status:** aceito (22/10/2026) — decidido durante a execução da Fase 1, pendente de revisão do Lucas

## Contexto

A API de discursos traz um resumo oficial (`sumario`) de cada fala. A primeira versão do Caderno 5 mostrava os 3 resumos mais recentes. Na conferência, os resumos traziam acusações do deputado contra terceiros citados pelo nome, inclusive pessoas que não são deputados. Mesmo sendo texto oficial e descrevendo o que o deputado disse, colocar esses trechos em destaque (os "3 mais recentes" são um recorte arbitrário) amplifica conteúdo político e acusações sem contexto nem resposta, o que vai contra a neutralidade do site.

## Decisão

- ⚠ A ficha mostra só **contagens** (total, por ano, por fase) e a **data do último discurso**, com link para a página oficial do deputado na Câmara, onde estão textos e vídeos.
- O pipeline não guarda mais os resumos (nem no cache).

## Consequências

- Quem quiser saber o que o deputado disse vai à fonte oficial.
- Se no futuro houver uma forma neutra de apresentar conteúdo (por exemplo, temas oficiais dos discursos, se a Câmara publicar), dá para rever.
