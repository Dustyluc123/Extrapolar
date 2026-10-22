# 0010 — Apresentação neutra da ficha do deputado

**Status:** aceito (22/10/2026) — decidido durante a execução noturna, pendente de revisão do Lucas

## Contexto

A ficha mostra a participação de cada deputado. Vários detalhes de apresentação podem induzir julgamento sem que nenhuma palavra proibida apareça.

## Decisão

- **Mesma cor para todos:** o número e a barra usam tinta (preto/creme), nunca vermelho para "baixo" ou verde para "alto". O vermelho do site é só marca-texto e links.
- **Sem comparação com a média da Câmara** nesta fase. Uma referência como "mediana: 81%" ajuda no contexto, mas convida a comparar e ordenar. Fica para decidir junto com o "monte seu ranking".
- **Aviso de poucas votações** quando há menos de 30 votações elegíveis (documentado em `docs/METODOLOGIA.md`). O número 30 é uma escolha de apresentação, não estatística; pode ser ajustado.
- **Sem gênero inventado:** o rótulo acima do nome é "Câmara dos Deputados · {estado}", e não "Deputado federal", porque a lista da API não informa o gênero. (O arquivo estático `deputados.json` da Câmara tem `siglaSexo`; dá para usar depois, se fizer sentido.)
- **Selos de partido e UF sempre neutros**, nunca com a cor do partido.
- **"Sem dado" nunca é 0%**: sem votação elegível, a ficha mostra "Sem dado" com a explicação.
- **A data da edição** no cabeçalho é a data de referência dos dados (quando o pipeline rodou, em horário de Brasília), não a data do build. A data da última votação considerada aparece na capa.

## Consequências

- Nenhum elemento visual sugere quem está "bem" ou "mal".
- O leitor precisa de outro lugar para comparar deputados; isso é intencional nesta fase.
