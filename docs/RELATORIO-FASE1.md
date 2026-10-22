# Relatório — Fase 1 (rascunho em andamento)

> Rascunho atualizado a cada etapa; a versão final substitui este cabeçalho.

## Etapas

### Etapa 1 — Base (`ecc6894`)

- Dados por deputado (`deputados/{id}.json`), `metricas.json` (Fase 2) e `MetricValue` padronizado com motivos de "sem dado" (ADR 0012).
- Ficha em cadernos, bloco `Metric.astro`, `NoData.astro`, navegação entre cadernos.
- Gráficos: `Columns` (SVG), `BarList` e `Timeline` (HTML/CSS), `ChartFigure` com tabela (ADR 0013).
- `/glossario` (9 termos iniciais), `Term.astro`.
- `formatBRL`, `formatBRLCompact`; `pnpm repo-growth`.
- Crescimento medido na migração (uma vez só): 141 KB comprimidos.

### Etapa 2 — Plenário

- Presença em sessões deliberativas: 392 sessões (PLEN, "Sessão Deliberativa", "Encerrada…"); mediana 93,9%, mínimo 43,1%; 39 presenças fora do período (contadas).
- Alinhamento com o partido (partido → federação; bloco não, ADR 0014): mediana 98,5%; 37 deputados "sem dado"; União/PP/MDB/Republicanos/Podemos com 14 a 41 votações comparáveis em média.
- Alinhamento com o Governo: Governo orientou em 1.127 de 1.128 votações; mediana 81,2%, mínimo 16,8%.
- Conferido: todos os nomes de bancada de partido batem com exatamente um partido (abreviações "Solidaried", "Republican", "Podemos"=PODE).
- Chrome 155 demorou para abrir no headless; espera do script de 10 s para 30 s.

### Etapa 3 — Comissões

- 5.538 reuniões de comissão; mediana de 2 comissões como titular hoje (53 deputados com zero); presença em comissões com mediana de 57%; 13 deputados nunca titulares (ministros licenciados, Mesa, suplentes recentes).
- Eventos a pedido: mediana 8, máximo 204; 12 requerimentos sem autoria na legislatura.
- Linha do tempo com vários trechos por comissão; comissões só de suplência numa lista recolhida.
- Script de capturas aceita âncora (`/deputados/ID#caderno`) e passa por about:blank antes de navegar (navegação só de âncora travava).

### Etapa 4 — Projetos e leis

- Proposições (PL, PLP, PEC, PDL, PRC): mediana de 24 como autor principal (16 deputados com zero; máximo 1.223); 159 viraram norma no total; taxa de conversão com mediana 0%.
- Situação: todos os 36 códigos encontrados de 2023 a 2026 classificados em 8 categorias.
- Temas oficiais (32) com "Homenagens e Datas Comemorativas" (código 72) separado pelo nome oficial.
- Pareceres de relator: viável (PRL/PRLP/PRLE têm um único autor, o relator); mediana 26; membros da Mesa chegam a 10.807 (pareceres sobre requerimentos de informação).
- Download com nova tentativa quando a conexão cai no meio do corpo (aconteceu com o arquivo de 160 MB).
- Heap do pipeline aumentada para 6 GB (arquivos de proposições).

### Etapa 5 — Fiscalização

- RIC (mediana 2, máximo 4.966), PFC (166 no total), convocações pelos tipos oficiais 523/356/150 (1.208 como autor principal) e indicações (mediana 2) mostradas à parte como "sugestões ao governo".
- Série trimestral de RIC + PFC (16 trimestres).
- Convocações: viável por tipo oficial (codTipo), sem busca por palavras na ementa — não foi preciso medir precisão.

### Etapa 6 — Voz

- Discursos pela API (sem arquivo estático): ~800 requisições, cache de 7 dias (atualização semanal), primeira carga ~12 min; diário com cache ~1 min no total do pipeline.
- API com erro 500 persistente em alguns períodos: coleta dividida em anos e meses; 29 meses de 24 deputados (ago–out/2026) ficaram indisponíveis e aparecem na ficha.
- Mediana de 33 discursos; 25 deputados sem discurso; máximo 1.819.
- Cache de discursos reduzido: 6,9 MB (sem transcrição nem resumo).

## Decisões (marcar ⚠ as que mudam números ou o que o leitor vê)

- ⚠ Orientação de bloco não usada (decidido no planejamento); efeito grande em partidos que orientam pelo bloco — ADR 0014.
- ⚠ Partido considerado no alinhamento = partido na data da votação (registrado no voto), não o atual.
- ⚠ Alinhamento conta só votações em que votou Sim/Não/Abstenção/Obstrução e a orientação foi uma dessas; liberado, sem orientação, só bloco, Art. 17 e secreto ficam fora e aparecem contados na ficha.
- ⚠ Presença: só "Sessão Deliberativa" encerrada do PLEN; presença fora do período conta (mesma regra da participação).
- ⚠ "Comissão" = Permanente, Especial ou CPI; "titular" inclui presidente e vices (a linha de Titular some durante a presidência).
- ⚠ Presença em comissões só com os 8 tipos de reunião com presença regularmente registrada; seminários, mesas-redondas, visitas etc. fora.
- ⚠ Eventos a pedido: autor = proponente em qualquer posição (apoio não conta); evento conta uma vez por deputado.
- ⚠ Projetos = PL, PLP, PEC, PDL e PRC; autor principal = ordemAssinatura 1; coautor = demais proponentes; apoio (proponente 0) não é autoria.
- ⚠ Taxa de conversão = viraram norma (código 1140) ÷ apresentados como autor principal na legislatura; tabela de códigos de situação na metodologia.
- ⚠ Temas: projeto conta em cada tema; homenagens pelo tema oficial 72, sem classificação própria.
- ⚠ Pareceres: PRL + PRLP + PRLE de autoria do deputado, por órgão numerador (inclui a Mesa).
- ⚠ Fiscalização conta autor principal como número principal (coautoria à parte), igual aos projetos.
- ⚠ Convocação = só os 3 tipos oficiais de requerimento; convites (audiência pública) ficam fora.
- ⚠ Discursos com atualização semanal (ADR 0015); a ficha mostra a data da consulta.
- ⚠ A ficha não reproduz o conteúdo nem os resumos oficiais dos discursos, só contagens e a data do último (ADR 0016): os resumos traziam acusações contra terceiros citados pelo nome.
- Aviso de "base pequena" (< 30) generalizado para todas as porcentagens (componente FewNotice).

- Gráficos de barras e linha do tempo em HTML+CSS em vez de SVG (rótulos longos quebram linha no celular) — ADR 0013.

## Fora do escopo / não viável

## TODOs para o Lucas

## Medidas

- Pipeline (Fase 0, com cache): ~7 s; sem cache: ~2 min 20 s.
