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

## Decisões (marcar ⚠ as que mudam números ou o que o leitor vê)

- ⚠ Orientação de bloco não usada (decidido no planejamento); efeito grande em partidos que orientam pelo bloco — ADR 0014.
- ⚠ Partido considerado no alinhamento = partido na data da votação (registrado no voto), não o atual.
- ⚠ Alinhamento conta só votações em que votou Sim/Não/Abstenção/Obstrução e a orientação foi uma dessas; liberado, sem orientação, só bloco, Art. 17 e secreto ficam fora e aparecem contados na ficha.
- ⚠ Presença: só "Sessão Deliberativa" encerrada do PLEN; presença fora do período conta (mesma regra da participação).
- Aviso de "base pequena" (< 30) generalizado para todas as porcentagens (componente FewNotice).

- Gráficos de barras e linha do tempo em HTML+CSS em vez de SVG (rótulos longos quebram linha no celular) — ADR 0013.

## Fora do escopo / não viável

## TODOs para o Lucas

## Medidas

- Pipeline (Fase 0, com cache): ~7 s; sem cache: ~2 min 20 s.
