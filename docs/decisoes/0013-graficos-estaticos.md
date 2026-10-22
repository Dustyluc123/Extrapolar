# 0013 — Gráficos estáticos gerados no build, sem biblioteca

**Status:** aceito (22/10/2026) — Fase 1

## Contexto

O briefing pede gráficos sem custo e sem peso no navegador, no estilo de infográfico de jornal, acessíveis, legíveis no celular e na edição noturna.

## Decisão

- **Nenhuma biblioteca de gráficos.** Componentes Astro em `apps/web/src/components/charts/`, renderizados no build, sem JavaScript no navegador.
- **Séries no tempo** (`Columns.astro`): SVG com posições horizontais em porcentagem e alturas em pixels. Assim o gráfico ocupa a largura disponível sem encolher o texto (com `viewBox`, o texto ficaria minúsculo no celular).
- **Barras horizontais e linhas do tempo** (`BarList.astro`, `Timeline.astro`): HTML + CSS com larguras em porcentagem. Rótulos longos (nomes de comissões, categorias de despesa) quebram linha, o que texto em SVG não faz.
- **Cores por classe** (`fill-ink`, `bg-accent`...), que seguem os tokens e a edição noturna. Tinta para tudo; vermelho-tomate só para destacar o valor principal.
- **Acessibilidade:** todo gráfico fica dentro de `ChartFigure.astro`, com título, descrição em texto e a tabela com os mesmos dados (recolhida). O desenho em si é `aria-hidden`.
- **Rótulos diretos** (valor ao lado da barra), números em pt-BR (`formatBRLCompact`: "R$ 1,2 mi").

## Consequências

- Zero KB de JavaScript por gráfico; o custo é só HTML.
- Tipos de gráfico novos exigem um componente novo (sem a variedade pronta de uma biblioteca). Para o que a ficha precisa (barras, colunas, linha do tempo), basta.
