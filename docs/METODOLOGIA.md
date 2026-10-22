---
title: Metodologia
description: Como cada número do Extrapolar é calculado, de onde vem e o que ele não mostra.
---

# Metodologia

Cada número do Extrapolar vem de uma fonte oficial da Câmara dos Deputados e é calculado sempre do mesmo jeito para todos os deputados. Aqui está, para cada indicador, o que ele mede, como é calculado e, tão importante quanto, **o que ele não mede**.

Nenhum indicador sozinho diz se um mandato é bom ou ruim. Eles mostram uma parte do trabalho; quem tira conclusões é você.

## Regras gerais

- **Fonte:** [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/). Usamos os arquivos que a Câmara publica todos os dias e, quando não há arquivo, a API oficial.
- **Atualização:** os dados são baixados uma vez por dia. Cada página mostra a data da última atualização.
- **Período:** a legislatura atual (57ª, de 1º de fevereiro de 2023 a 31 de janeiro de 2027), até a data da última atualização.
- **Quem aparece:** os deputados que estão em exercício na data da atualização, segundo a Câmara.
- **Dado ausente** aparece como "sem dado", nunca como zero.
- **Sem ranking:** o site não ordena deputados por nenhum indicador.

<a id="participacao"></a>

## Participação em votações nominais de plenário

### O que é

A porcentagem das votações nominais do plenário em que o deputado registrou voto, considerando só os dias em que ele estava em exercício do mandato.

### Por que só votações nominais de plenário

- **Plenário** é onde todos os 513 deputados podem votar. Nas comissões, só votam os membros de cada uma, então a comparação não seria justa.
- **Nominal** é a votação em que cada voto fica registrado com o nome do deputado (no painel eletrônico). Na votação **simbólica**, a mais comum, o presidente da sessão só anuncia o resultado e ninguém tem voto individual registrado. Por isso, só as nominais permitem saber quem votou.

Na prática, uma votação entra na conta quando o órgão é o Plenário (`siglaOrgao = "PLEN"`) e existe ao menos um voto individual registrado para ela no arquivo de votos da Câmara.

### Como é calculado

```
participação = votações em que o deputado registrou voto
               ÷ votações nominais de plenário enquanto ele estava em exercício
```

1. **Votações elegíveis:** todas as votações nominais de plenário da legislatura que aconteceram (data e hora do registro da votação) dentro de um período em que o deputado estava em exercício.
2. **Períodos em exercício:** montados a partir do histórico oficial de cada deputado (`/deputados/{id}/historico`). Um período começa num evento com situação "Exercício" e termina no próximo evento com outra situação (por exemplo "Licença", "Suplência", "Fim de Mandato"). Eventos sem situação (troca de nome ou de partido) não mudam o período. Eventos datados antes do início da legislatura são ignorados, mesmo que a Câmara os marque com a legislatura atual (acontece em alguns históricos). Se um período ainda está aberto, ele vai até a data da atualização.
3. **Votou:** conta como participação **qualquer voto registrado**: "Sim", "Não", "Abstenção", "Obstrução", "Artigo 17" e voto secreto. A ficha mostra separadamente quantos foram "Obstrução", "Artigo 17" e secretos.
4. **Voto fora do período:** se o deputado tem voto registrado numa votação que caiu fora dos períodos montados pelo histórico, essa votação também entra no total (se ele votou, estava em exercício). Isso costuma acontecer em minutos de diferença entre o horário da posse e o horário da votação.
5. **Sem votações elegíveis:** se não houve nenhuma votação nominal enquanto o deputado estava em exercício (por exemplo, um suplente que assumiu ontem), a participação aparece como "sem dado", não como 0%.

### O que os tipos de voto significam

- **Sim / Não:** a favor ou contra a proposta votada.
- **Abstenção:** o deputado registrou presença na votação, mas não votou nem a favor nem contra.
- **Obstrução:** o deputado registrou que está em obstrução, um instrumento usado para tentar impedir que a votação alcance o número mínimo de presentes. É uma escolha política registrada, por isso conta como participação.
- **Voto secreto:** em votações secretas (por exemplo, eleição de membros de conselhos ou aprovação de indicações a tribunais), a Câmara registra que o deputado votou, mas não o conteúdo do voto. Conta como participação.
- **Artigo 17:** registrado para quem estava presidindo a sessão naquele momento. Nos dados da Câmara, aparece na maior parte das vezes para o Presidente da Câmara e, nas demais, para deputados que o substituíam na presidência. Quem preside normalmente não vota, então conta como participação. <!-- TODO: conferir na fonte oficial o dispositivo do Regimento Interno: https://www2.camara.leg.br/atividade-legislativa/legislacao/regimento-interno-da-camara-dos-deputados -->

### O que este número **não** mede

- **Não mede trabalho fora do plenário:** comissões, relatorias, projetos apresentados, atendimento ao estado, articulação política.
- **Não mede votações simbólicas**, que são a maioria das decisões do plenário.
- **Não mede como o deputado votou**, só se registrou voto.
- **Não mede presença na sessão:** um deputado pode estar presente e não votar numa votação específica, e o registro de presença na sessão é outra coisa.
- **Não diferencia o motivo da ausência:** missão oficial, doença, compromisso no estado ou outro motivo aparecem igual.

### Limitações conhecidas

- **Licenças e cargos no governo:** deputado licenciado (por exemplo, para ser ministro) não é cobrado pelas votações do período de licença, porque só contamos os dias em exercício. Mas quem ficou pouco tempo em exercício tem poucas votações na conta, e a porcentagem pode mudar muito com poucos votos. A ficha mostra sempre o número de votações consideradas ao lado da porcentagem. Quando são menos de 30 votações, a ficha mostra um aviso de que a porcentagem pode mudar bastante.
- **Suplentes:** entram e saem conforme os titulares se licenciam. A conta usa só os períodos em que cada suplente estava em exercício.
- **Quem preside a sessão** aparece com "Artigo 17" e, por isso, com participação alta mesmo sem votar.
- **Horários:** a comparação entre o horário da votação e o horário de posse ou licença usa os horários publicados pela Câmara (horário de Brasília). Erros de registro da Câmara se refletem aqui.
- **Mudanças nos dados de origem:** a Câmara pode corrigir dados antigos. Como baixamos tudo de novo regularmente, os números podem mudar levemente de um dia para o outro.

### Fontes usadas

- Lista de deputados em exercício: `GET https://dadosabertos.camara.leg.br/api/v2/deputados`
- Histórico de cada deputado: `GET https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/historico`
- Votações: `https://dadosabertos.camara.leg.br/arquivos/votacoes/json/votacoes-{ano}.json`
- Votos individuais: `https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/json/votacoesVotos-{ano}.json`

### Exemplo

Se, enquanto um deputado estava em exercício, houve 200 votações nominais no plenário e ele registrou voto em 180 delas, a participação dele é 180 ÷ 200 = 90%.
