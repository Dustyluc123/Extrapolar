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

## Atualização — Fase 2 (22/10/2026): "Monte seu ranking"

- `/ranking` é a **única exceção** ao "sem ordenação": a lista é ordenada pelos critérios **de quem a monta** (métricas, pesos de 0 a 5 e direção de cada uma). Começa vazia: **não há métricas, pesos nem direções padrão**, nem "ranking recomendado". O site não decide se mais é melhor ou pior: o leitor escolhe "maior sobe" ou "menor sobe" em cada métrica.
- Aviso permanente no topo: "Este ranking reflete os critérios de quem o montou, não uma avaliação do Extrapolar."
- Normalização em percentil entre os deputados com dado; "sem dado" não é zero (o deputado sai da classificação e aparece numa lista à parte, com o motivo); base pequena (< 30) com aviso. Cada posição mostra quanto cada métrica somou.
- Critérios e filtros na URL, para compartilhar "o meu ranking".
- A **ficha continua sem comparação**, média ou posição; a capa continua em ordem alfabética.
- No jogo "Vote você também", a lista de deputados é ordenada pela concordância com os votos **do próprio jogador** — mesma lógica: o critério é de quem joga.
