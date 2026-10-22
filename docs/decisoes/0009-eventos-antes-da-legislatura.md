# 0009 — Ignorar eventos do histórico datados antes da legislatura

**Status:** aceito (22/10/2026) — decidido durante a execução noturna, pendente de revisão do Lucas

## Contexto

O histórico de alguns deputados traz eventos marcados com `idLegislatura: 57`, mas datados antes de 01/02/2023. Exemplo real: um suplente com evento "Exercício — Alteração de partido" em 31/03/2022 marcado como 57ª legislatura. Sem tratamento, isso abria um período em exercício desde 2022 e cobrava dele todas as votações da legislatura (taxa de 1,3% em vez da real).

## Decisão

Eventos do histórico só contam se estiverem dentro da legislatura (a partir de `start`, 00:00). Eventos anteriores são ignorados e contados no aviso `evento-antes-da-legislatura` em `meta.json` (8 casos em 22/10/2026).

## Consequências

- Titulares não são afetados: todos têm o evento de posse dentro da legislatura.
- Se um suplente estiver em exercício de forma contínua desde a legislatura anterior sem evento novo de posse, ele ficaria sem período. O pipeline avisa esse caso com `em-exercicio-sem-periodo-aberto` (zero casos em 22/10/2026).
