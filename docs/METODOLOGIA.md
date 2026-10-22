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
- **Artigo 17:** registrado para quem estava presidindo a sessão naquele momento. Nos dados da Câmara, aparece na maior parte das vezes para o Presidente da Câmara e, nas demais, para deputados que o substituíam na presidência. Quem preside normalmente não vota, então conta como participação.

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

<a id="presenca-sessoes"></a>

## Presença em sessões deliberativas do plenário

### O que é

A porcentagem das sessões deliberativas do plenário (as sessões em que há votação) em que o deputado registrou presença, contando só os dias em que estava em exercício.

### Como é calculado

```
presença = sessões deliberativas com presença registrada
           ÷ sessões deliberativas do plenário enquanto ele estava em exercício
```

1. **Sessões que entram:** eventos do órgão Plenário (`PLEN`) do tipo "Sessão Deliberativa" com situação "Encerrada" (ou "Encerrada (Final)"), dentro da legislatura e até a data da atualização. Ficam fora sessões canceladas, sessões não deliberativas (solenes, de homenagem), comissões gerais e outros eventos: nenhum deles tem presença registrada nos dados.
2. **Períodos em exercício:** os mesmos da participação (histórico oficial de cada deputado).
3. **Presença fora do período:** se há presença registrada numa sessão fora dos períodos montados pelo histórico, ela conta (se estava presente, estava em exercício). O pipeline registra quantos casos assim aconteceram (39 em 22/10/2026).
4. **Sem sessões elegíveis:** "sem dado", nunca 0%.

### O que este número **não** mede

- **Não diferencia ausência justificada** (missão oficial, licença médica curta, compromisso no estado): os dados abertos registram só a presença.
- **Não é o mesmo que votar:** a presença vale para a sessão; o deputado pode estar presente e não votar numa votação (isso aparece na participação).
- **Não mede o que o deputado fez na sessão** (discursos, articulação).

### Fontes usadas

- Eventos: `https://dadosabertos.camara.leg.br/arquivos/eventos/json/eventos-{ano}.json`
- Órgãos de cada evento: `https://dadosabertos.camara.leg.br/arquivos/eventosOrgaos/json/eventosOrgaos-{ano}.json`
- Presenças: `https://dadosabertos.camara.leg.br/arquivos/eventosPresencaDeputados/json/eventosPresencaDeputados-{ano}.json`

<a id="alinhamento-partido"></a>

## Alinhamento com a orientação do partido

### O que é

Antes de cada votação, a liderança de cada partido (ou federação, ou bloco) recomenda como a bancada deve votar: a **orientação de bancada**. Este número é a porcentagem das votações nominais do plenário em que o deputado votou igual à orientação do partido dele.

**Alinhamento alto ou baixo não é, por si só, positivo nem negativo.** Ele descreve como o deputado vota em relação à recomendação do partido; o voto é sempre individual.

### Como é calculado

```
alinhamento = votações em que o voto foi igual à orientação
              ÷ votações comparáveis
```

1. **Votações:** as mesmas votações nominais de plenário da participação, só aquelas em que o deputado votou.
2. **Partido:** o partido do deputado **na data da votação**, como registrado no próprio voto (quem trocou de partido é comparado com o partido de cada momento).
3. **Qual orientação vale:** a do próprio partido. Se o partido não orientou e faz parte de uma **federação**, vale a da federação (a composição das federações vem da API oficial `/blocos` e é fixa durante a legislatura). **Orientação de bloco não é usada:** os dados abertos não informam quais partidos formavam cada bloco na data da votação (o nome do bloco vem abreviado e a API só lista os blocos atuais), então não dá para atribuir com segurança a orientação do bloco a um partido (ADR 0014).
4. **Votação comparável:** o deputado votou Sim, Não, Abstenção ou Obstrução, e a orientação foi Sim, Não, Abstenção ou Obstrução. Ficam fora — e aparecem contadas na ficha — as votações em que a orientação foi "Liberado", em que não houve orientação, em que só o bloco orientou, e aquelas em que o voto do deputado foi "Artigo 17" ou secreto.
5. **Sem votação comparável:** "sem dado", nunca 0%. Com menos de 30 votações comparáveis, a ficha avisa que a base é pequena.

### Limitações conhecidas

- **Partidos que orientam pelo bloco ficam com poucas votações na conta.** Em 22/10/2026, deputados de União, PP, MDB, Republicanos e Podemos tinham, em média, de 14 a 41 votações comparáveis (contra mais de 400 em partidos que orientam sozinhos, como PL, PT e Novo); 37 deputados ficaram "sem dado". Isso é efeito da regra conservadora acima, não de comportamento do deputado.
- **Nomes de bancada:** a Câmara abrevia alguns nomes ("Solidaried", "Republican") e usa "Podemos" para o PODE. O pipeline reconhece esses casos (lista conferida nos arquivos de 2023 a 2026); um nome novo não reconhecido deixa a votação como "sem orientação".
- **Não mostra o conteúdo** das votações nem o motivo de votar diferente.

### Fontes usadas

- Orientações: `https://dadosabertos.camara.leg.br/arquivos/votacoesOrientacoes/json/votacoesOrientacoes-{ano}.json`
- Votos: os mesmos da participação.
- Federações: `GET https://dadosabertos.camara.leg.br/api/v2/blocos?idLegislatura=57` e `/blocos/{id}/partidos`

<a id="alinhamento-governo"></a>

## Alinhamento com a orientação do Governo

### O que é

O **líder do Governo** na Câmara também orienta o voto em cada votação. Este número é a porcentagem das votações nominais do plenário em que o deputado votou igual a essa orientação.

É um número **descritivo**: não classifica o deputado como "da base" ou "da oposição" e não avalia se votar com o Governo é positivo ou negativo.

### Como é calculado

Igual ao alinhamento com o partido, usando a orientação da bancada "Governo" nos arquivos de orientação. O Governo orientou em 1.127 das 1.128 votações nominais de plenário da legislatura (até 22/10/2026). Votações com orientação "Liberado" ou sem orientação ficam fora e aparecem contadas na ficha.

### O que este número **não** mede

- Não diz por que o deputado votou com ou contra o Governo, nem o tema das votações.
- O Governo muda de posição conforme o tema; o número mistura votações de assuntos muito diferentes.
- Não conta ausências (elas aparecem na participação).
