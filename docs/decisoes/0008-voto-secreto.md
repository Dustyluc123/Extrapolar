# 0008 — Voto secreto conta como participação

**Status:** aceito (22/10/2026) — decidido durante a execução noturna, pendente de revisão do Lucas

## Contexto

Ao rodar o pipeline com os arquivos de 2025 e 2026, apareceu um valor de voto que não existia em 2023: `""` (vazio). Ele aparece em uma votação por ano (`2576389-4`, eleição para o CNJ em 29/10/2025; `2645346-18`, indicação ao TCU em 02/09/2026). Nas duas, a votação está marcada como "Votação secreta em turno único", todos os votos estão vazios e o número de votos é igual ao total oficial (sim + não + outros).

## Decisão

- Voto vazio em votação secreta = voto registrado com conteúdo sigiloso. **Conta como participação** (coerente com "qualquer voto registrado conta", ADR 0007) e aparece separado como "voto secreto" (`breakdown.secret`).
- Votação secreta é reconhecida pela descrição da última abertura de votação (`ultimaAberturaVotacao.descricao` contém "secreta").
- **Voto vazio em votação não marcada como secreta faz o pipeline falhar**, com mensagem clara, para não publicar um dado de significado desconhecido.

## Consequências

- Duas votações a mais na conta de todos os deputados que votaram nelas.
- Se a Câmara passar a usar voto vazio em outro sentido, o pipeline para e alguém precisa olhar.
