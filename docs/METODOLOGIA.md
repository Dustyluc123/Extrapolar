---
title: Metodologia
description: Como cada número do Extrapolar é calculado, de onde vem e o que ele não mostra.
---

# Metodologia

Cada número do Extrapolar vem de uma fonte oficial da Câmara dos Deputados e é calculado sempre do mesmo jeito para todos os deputados. Aqui está, para cada indicador, o que ele mede, como é calculado e, tão importante quanto, **o que ele não mede**.

Nenhum indicador sozinho diz se um mandato é bom ou ruim. Eles mostram uma parte do trabalho; quem tira conclusões é você.

## Regras gerais

- **Fonte:** [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/). Usamos os arquivos que a Câmara publica todos os dias e, quando não há arquivo, a API oficial.
- **Emendas parlamentares:** [Portal da Transparência](https://portaldatransparencia.gov.br/emendas), da Controladoria-Geral da União (CGU), download em lote.
- **Discursos:** atualizados uma vez por semana (a única fonte é a API, mais lenta).
- **Atualização:** os dados são baixados uma vez por dia. Cada página mostra a data da última atualização.
- **Período:** a legislatura atual (57ª, de 1º de fevereiro de 2023 a 31 de janeiro de 2027), até a data da última atualização.
- **Quem aparece:** os deputados que estão em exercício na data da atualização, segundo a Câmara.
- **Dado ausente** aparece como "sem dado", nunca como zero.
- **Sem ranking:** o site não ordena deputados por nenhum indicador nem mostra médias ou comparações. Os valores brutos de cada métrica ficam guardados (com numerador e denominador) para uma futura ferramenta em que o próprio leitor escolhe o que comparar.

### O que ficou de fora (e por quê)

- **"Eficiência" da verba de gabinete:** a Câmara não publica o gasto com salários por gabinete em formato de dados abertos (só em páginas da web); o site mostra só o tamanho da equipe.
- **"Relevância" ou "qualidade" dos projetos:** exigiria julgar o mérito, o que fere a neutralidade. No lugar, a ficha mostra os temas oficiais da Câmara.
- **"Representar a sociedade e ouvir a base":** não há dado oficial que meça isso diretamente. O mais próximo são as audiências e eventos realizados a pedido do deputado e os discursos.
- **Conteúdo dos discursos:** a ficha mostra quantidades, não o que foi dito (ADR 0016); o texto está na página oficial do deputado.
- **Orientação de bloco no alinhamento com o partido:** a composição histórica dos blocos não é publicada (ADR 0014).

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

<a id="comissoes"></a>

## Comissões de que participa

### O que é

A lista de cargos do deputado nos órgãos da Câmara durante a legislatura (comissões permanentes, especiais, CPIs, Mesa, conselhos, subcomissões e outros), com o período de cada um. O número principal é **em quantas comissões ele é titular hoje**.

### Como é calculado

- **Fonte:** o arquivo de participação dos deputados nos órgãos da legislatura (`orgaosDeputados-L57`), cruzado com a lista de órgãos (`orgaos`) para saber o tipo de cada um.
- **"Comissão"**, para o número principal, a linha do tempo e a presença, quer dizer: Comissão Permanente, Comissão Especial ou Comissão Parlamentar de Inquérito. Os outros órgãos aparecem numa lista à parte.
- **"Titular"** inclui quem ocupa a presidência ou uma vice-presidência da comissão: eles são membros com direito a voto, e nos dados a linha de "Titular" às vezes não aparece durante a presidência.
- **Titular hoje:** comissões distintas em que o deputado tem cargo de titular, presidente ou vice na data da atualização. Zero é um valor válido (não é "sem dado").
- **Datas:** o arquivo traz data de início e de fim de cada cargo; cargo sem data de fim está em andamento. Linhas com data de fim anterior à de início são ignoradas (4 casos em 22/10/2026, registrados nos avisos de qualidade).

### O que este número **não** mede

- O que o deputado fez nas comissões (relatorias, votos, perguntas).
- A importância de cada comissão. A distribuição de vagas depende de acordos entre os partidos, proporcionais ao tamanho das bancadas.

<a id="presenca-comissoes"></a>

## Presença nas reuniões das comissões

### O que é

A porcentagem das reuniões das comissões em que o deputado era titular (ou presidente ou vice) em que ele registrou presença.

### Como é calculado

```
presença em comissões = reuniões com presença registrada
                        ÷ reuniões realizadas das comissões em que era titular, na data da reunião
```

1. **Comissões:** permanentes, especiais e CPIs (como acima). Comissões em que é só suplente não entram.
2. **Reuniões que entram:** eventos encerrados desses órgãos dos tipos **Reunião Deliberativa, Audiência Pública, Audiência Pública e Deliberação, Reunião de Comparecimento de Ministro(a), Reunião, Reunião de Instalação e Eleição, Reunião de Eleição e Tomada de Depoimento**. Em 2025, esses tipos tinham presença registrada em 99% das reuniões encerradas.
3. **Ficam fora:** seminários, mesas-redondas, visitas técnicas, reuniões técnicas, debates, testes do painel eletrônico e outros eventos. Nesses, a presença é registrada de forma irregular (por exemplo, em 2025 só 68 de 116 mesas-redondas encerradas tinham alguma presença), então incluí-los contaria como ausência o que é falta de registro.
4. **Titular na data:** a reunião só entra se, no dia dela, o deputado tinha cargo de titular, presidente ou vice naquela comissão. Reuniões conjuntas de várias comissões entram se ele era titular de qualquer uma delas.
5. **Períodos em exercício:** também respeitados, como nas outras métricas.
6. **Nunca foi titular:** "sem dado" com esse motivo (não é 0%).

### O que este número **não** mede

- **Choque de horário:** comissões se reúnem ao mesmo tempo; quem é titular de várias pode ter duas reuniões no mesmo horário e só conseguir estar em uma.
- Ausências justificadas (os dados não trazem a justificativa).
- O que o deputado fez na reunião.

<a id="eventos-requeridos"></a>

## Audiências e eventos realizados a pedido do deputado

### O que é

Quantos eventos (audiências públicas, seminários, sessões solenes, comparecimento de ministros...) **já realizados** na legislatura tiveram origem em um requerimento de que o deputado é autor. É o dado oficial mais próximo de "ouvir a sociedade" que os dados abertos permitem.

### Como é calculado

1. **Ligação evento → requerimento:** arquivo `eventosRequerimentos-{ano}` (cada linha liga um evento a um requerimento; um evento pode ter vários).
2. **Autoria:** arquivo `proposicoesAutores-{ano}`. Conta como autor o deputado **proponente** (`proponente = 1`), em qualquer posição; assinaturas de apoio (`proponente = 0`) não contam. A ficha mostra também em quantos ele foi o **primeiro signatário** (`ordemAssinatura = 1`).
3. **Evento realizado:** situação "Encerrada…", dentro da legislatura e até a data da atualização. Cada evento conta uma vez por deputado, mesmo com vários requerimentos dele.
4. **Requerimentos sem autoria conhecida:** se o requerimento não está nos arquivos de proposições da legislatura (por exemplo, apresentado antes de 2023), o evento não é atribuído a ninguém (12 casos em 22/10/2026).

### O que este número **não** mede

- Muitos eventos são pedidos por vários deputados juntos; todos eles contam o evento.
- Pedidos rejeitados ou ainda não realizados.
- A qualidade ou o resultado do evento.

<a id="proposicoes"></a>

## Projetos apresentados

### O que é

Quantos projetos que podem virar norma o deputado apresentou na legislatura **como autor principal** (o primeiro a assinar), e à parte quantos assinou **como coautor**.

### Como é calculado

- **Tipos contados:** Projeto de Lei (PL), Projeto de Lei Complementar (PLP), Proposta de Emenda à Constituição (PEC), Projeto de Decreto Legislativo (PDL) e Projeto de Resolução da Câmara (PRC).
- **Autoria:** arquivo `proposicoesAutores-{ano}`. **Autor principal** = assinatura com `ordemAssinatura = 1` (é única por proposição; conferido). **Coautor** = demais assinaturas com `proponente = 1`. As assinaturas com `proponente = 0` são **de apoio** (por exemplo, as exigidas para uma PEC começar a tramitar) e não contam como autoria; a ficha mostra quantas foram.
- **Período:** proposições apresentadas (`dataApresentacao`) de 1º de fevereiro de 2023 até a data da atualização. O arquivo de um ano traz também algumas proposições renumeradas com data antiga (vindas do Senado); elas ficam fora pela data.
- **Todos os tipos:** a ficha também lista, por subtipo oficial, tudo o que o deputado assinou como autor (requerimentos, emendas, pareceres, indicações...).

### O que este número **não** mede

- A importância ou a qualidade dos projetos: um projeto pode mudar muito ou quase nada. O site não classifica projetos por relevância (isso seria opinião).
- O trabalho de construir um projeto em conjunto com outros deputados, quando ele aparece só como coautor.

<a id="situacao-proposicoes"></a>

## O que aconteceu com os projetos

### O que é

A situação atual dos projetos de que o deputado é autor principal (mesmos tipos acima) e a **taxa de conversão**: quantos viraram norma jurídica.

```
taxa de conversão = projetos (autor principal) transformados em norma jurídica
                    ÷ projetos apresentados como autor principal na legislatura
```

### Como é calculado

A situação vem do código oficial `ultimoStatus.idSituacao` de cada proposição, agrupado assim (todos os códigos encontrados de 2023 a 2026 estão classificados; um código novo aparece como "outra situação" e gera aviso no pipeline):

| Categoria na ficha                                  | Códigos oficiais                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Virou norma jurídica                                | 1140 (Transformado em Norma Jurídica)                                                                            |
| Aprovado na Câmara, seguindo no Senado ou na sanção | 926, 1150, 939, 900, 1293, 929, 1270                                                                             |
| Em tramitação na Câmara                             | 907, 915, 924, 1170, 1201, 905, 904, 903, 918, 902, 932, 1220, 901, 1200, 910, 1221, 1091, 922, 1110, 1382, 1210 |
| Tramitando junto com outro projeto (apensado)       | 925, 927                                                                                                         |
| Arquivado                                           | 923                                                                                                              |
| Devolvido ou retirado                               | 1120, 950                                                                                                        |
| Sem situação informada                              | código vazio                                                                                                     |
| Outra situação                                      | 1230 (Transformado em nova proposição) e códigos novos                                                           |

Sem projeto como autor principal, a taxa é "sem dado".

### Limitações obrigatórias

- **Projetos levam anos.** Os apresentados recentemente ainda não tiveram tempo de ser votados; a taxa tende a ser baixa no começo de qualquer legislatura.
- **Apensação:** muitos projetos são juntados a outros parecidos e aprovados "dentro" deles. Nesse caso, a norma aparece só no projeto principal, que pode ser de outro autor; o projeto apensado continua como "tramitando junto".
- A aprovação depende da pauta, de acordos e do Senado, não só do autor. A taxa não mede esforço nem qualidade.

<a id="temas"></a>

## Temas dos projetos

### O que é

A distribuição dos projetos de que o deputado é autor principal pelos **temas oficiais** da Câmara (arquivo `proposicoesTemas-{ano}` e lista oficial `/referencias/proposicoes/codTema`, com 32 temas).

### Como é calculado

- Um projeto pode ter vários temas (até 12); ele conta uma vez em cada tema. A ficha mostra os 8 temas mais frequentes e a tabela completa.
- **Homenagens e Datas Comemorativas** (código 72) é um tema oficial da Câmara; a ficha mostra a parcela de projetos nesse tema, entre os que têm tema, usando o nome oficial.
- O site **não** cria classificação própria ("relevante", "estrutural"...): isso seria opinião.

### Limitações

- O tema diz o assunto, não o conteúdo nem a posição do projeto.
- Projetos recentes podem ainda não ter tema.

<a id="pareceres"></a>

## Pareceres como relator

### O que é

Quantos pareceres o deputado apresentou como **relator** na legislatura, por ano e por órgão.

### Como é calculado

- Os pareceres aparecem nos dados como proposições dos tipos **PRL** (Parecer do Relator, em comissão), **PRLP** (Parecer Proferido em Plenário) e **PRLE** (parecer às emendas). Conferido em 2025: todos (16.071) têm exatamente um autor, o deputado relator.
- O órgão é o que numerou o parecer (`uriOrgaoNumerador`): uma comissão, a Mesa ou o plenário.

### Limitações

- Quem escolhe os relatores é o presidente de cada comissão.
- Pareceres têm tamanhos muito diferentes. Na Mesa Diretora há muitos pareceres curtos sobre requerimentos de informação; por isso, membros da Mesa aparecem com milhares de pareceres.
- O número não diz se o parecer recomendou aprovar ou rejeitar.

<a id="ric"></a>

## Requerimentos de informação e propostas de fiscalização

<a id="pfc"></a>

### O que é

- **Requerimento de Informação (RIC):** pedido formal de explicação, por escrito, a um ministro ou órgão do governo federal (art. 50, § 2º, da Constituição).
- **Proposta de Fiscalização e Controle (PFC):** proposta para que uma comissão fiscalize um ato ou gasto do Poder Executivo.

São as ferramentas oficiais de fiscalização do Executivo que os dados abertos registram por autor.

### Como é calculado

- Proposições dos tipos `RIC` e `PFC` apresentadas na legislatura, a partir dos mesmos arquivos de proposições e de autores dos projetos.
- O número principal é **como autor principal** (primeiro signatário); a ficha mostra à parte as coautorias. Assinaturas de apoio não contam.
- **Por trimestre:** RIC + PFC como autor principal, pelo trimestre da data de apresentação. O primeiro trimestre de 2023 começa em 1º de fevereiro.

### O que este número **não** mede

- Se a autoridade respondeu, nem o conteúdo da resposta.
- A complexidade de cada pedido: todos contam igual.

<a id="convocacoes"></a>

## Requerimentos de convocação de ministros e autoridades

### O que é

Pedidos para que um ministro ou autoridade compareça (obrigatoriamente) à Câmara ou a uma comissão para prestar explicações.

### Como é calculado

- **Só pelo tipo oficial** do requerimento (`codTipo` no arquivo de proposições), sem busca de palavras na ementa:
  - 523 — Requerimento de Convocação de Ministro de Estado na Comissão (art. 50, CF);
  - 356 — Requerimento de Convocação de Ministro de Estado no Plenário (art. 50, CF);
  - 150 — Requerimento de Convocação de Autoridade.
- Autor principal e coautor como nos projetos.

### Limitações

- Conta pedidos **apresentados**, não convocações aprovadas nem realizadas.
- Pedidos de **convite** (presença não obrigatória) são registrados como requerimentos de audiência pública e não entram aqui.

<a id="indicacoes"></a>

## Indicações (sugestões ao governo)

### O que é

Com uma **indicação** (`INC`), o deputado sugere formalmente ao Poder Executivo (ou a outro órgão) que tome uma providência. O governo não é obrigado a seguir nem a responder. Por isso a ficha mostra as indicações **à parte**, como "sugestões ao governo", e não como fiscalização.

### Como é calculado

Proposições do tipo `INC` apresentadas na legislatura, como autor principal (e coautor à parte).

### Limitações

- Não mostra se a sugestão foi atendida.

<a id="discursos"></a>

## Discursos

### O que é

Quantos discursos o deputado fez na legislatura, segundo o registro da Câmara, por ano e por fase da sessão (Ordem do Dia, Breves Comunicações, Homenagem...).

### Como é calculado

- Fonte: API `GET /deputados/{id}/discursos` (não há arquivo estático), consultada com `dataInicio` = início da legislatura e `dataFim` = data da consulta.
- **Atualização semanal:** cada deputado é consultado de novo a cada 7 dias (ADR 0015). A ficha mostra quando foi a última consulta.
- Fase e tipo como registrados pela Câmara (`faseEvento.titulo`, `tipoDiscurso`). Discursos sem fase aparecem como "Fase não informada".
- **O conteúdo das falas não é reproduzido** (nem os resumos oficiais): a ficha mostra contagens e a data do último discurso, e aponta para a página oficial do deputado (ADR 0016).
- **Meses indisponíveis:** quando a API dá erro persistente para um período, o mês fica de fora e a ficha avisa.

### O que este número **não** mede

- O conteúdo ou a qualidade das falas.
- Falas em comissões.
- Quem preside a sessão tem muitas falas do tipo "fala do presidente", que fazem parte da condução dos trabalhos.

<a id="cota"></a>

## Cota parlamentar (CEAP)

### O que é

A Cota para o Exercício da Atividade Parlamentar é uma verba mensal de cada deputado para despesas do mandato (passagens, combustível, escritório no estado, divulgação...), paga por reembolso com nota fiscal. O teto mensal varia por estado por causa do preço das passagens aéreas até Brasília, e o saldo não usado num mês acumula para os meses seguintes do mesmo ano (não passa de um ano para outro).

### Como é calculado

- **Fonte:** arquivos `https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip` (um por ano, atualização diária), com o significado de cada campo explicado pela Câmara em [Dados abertos — CEAP](https://dadosabertos.camara.leg.br/howtouse/2023-12-26-dados-ceap.html).
- **Valor gasto** = soma de `vlrLiquido` (valor efetivamente debitado da cota: valor do documento menos a glosa). Valores negativos (compensação de passagens) entram na soma, como na fonte.
- **Mês** = mês de competência (`numAno`/`numMes`), que é o mês em que a despesa conta na cota; vai de fevereiro de 2023 até o mês da atualização.
- **Por categoria:** `txtDescricao` (categoria oficial da despesa).
- **Restituições** (`vlrRestituicao`, valor devolvido pelo deputado) são mostradas à parte e **não** descontadas do total, porque a Câmara informa que costumam gerar outro registro associado e descontar poderia contar duas vezes. (Em 22/10/2026 nenhum registro da legislatura tinha restituição.)
- Registros de lideranças (sem `ideCadastro`) não entram.

### Comparação com o teto

- O teto oficial por UF fica em `packages/shared/src/config/ceap-tetos.ts`, com fonte e vigência (ADR 0017).
- **Só há tabela oficial a partir de março de 2026** (Ato da Mesa nº 244/2026, valores da página oficial "Cota Parlamentar" da Câmara). De fevereiro de 2023 a fevereiro de 2026 a tabela oficial não foi encontrada: o valor fica **sem dado** e a ficha mostra só o valor gasto.
- **Proporção do teto** = gasto ÷ soma dos tetos mensais, somando só os meses que (1) têm teto oficial, (2) em que o deputado esteve em exercício pelo menos um dia e (3) já terminaram (o mês corrente fica fora porque as notas podem chegar até 90 dias depois). Como o saldo acumula ao longo do ano, a proporção de alguns meses pode passar de 100%.

### Limitações obrigatórias

- O teto é por estado; comparar valores gastos entre estados diferentes não é justo.
- Gastar menos não significa trabalhar menos (nem o contrário).
- Notas podem ser apresentadas até 90 dias depois, e reembolsos e glosas podem alterar valores depois.

<a id="equipe"></a>

## Equipe do gabinete

### O que é

Quantos **secretários parlamentares** estão lotados no gabinete do deputado, segundo o retrato do dia anterior publicado pela Câmara. Pelo Ato da Mesa nº 72/1997 (art. 7º, com redação da Resolução nº 39/2006), cada gabinete tem de 5 a 25 servidores remunerados.

### Como é calculado

- Fonte: `https://dadosabertos.camara.leg.br/arquivos/funcionarios/json/funcionarios.json` (sem histórico; só o retrato do dia anterior).
- Conta as pessoas do grupo "Secretário Parlamentar" cuja lotação (`uriLotacao`) é o deputado.
- Quando o arquivo não traz nenhum secretário lotado no gabinete (3 casos em 22/10/2026, abaixo do mínimo de 5, provavelmente posse recente), a ficha mostra "sem dado", não zero.

### Fora do escopo

- **Gasto mensal com a equipe por gabinete:** a Câmara não publica esse valor em formato estruturado (CSV, JSON ou API); só em páginas da web. Pelos critérios do projeto (sem raspagem de HTML), fica de fora nesta fase.

<a id="emendas"></a>

## Emendas parlamentares

### O que é

As **emendas individuais** são a parte do Orçamento federal que cada deputado pode indicar onde será gasta. A ficha mostra as emendas dos **orçamentos de 2024 em diante** (apresentadas durante este mandato; o orçamento de 2023 foi emendado em 2022, no mandato anterior).

### Como é calculado

- **Fonte:** download em lote do Portal da Transparência da CGU (`EmendasParlamentares.zip` → `EmendasParlamentares.csv`), sem necessidade de chave de acesso.
- **Ligação autor → deputado (ADR 0018):** o autor vem com nome e código do sistema de orçamento, não com o id da Câmara. A ligação é feita pelo **nome normalizado** (sem acento, pontuação, caixa e prefixo "Dep."), exigindo nome **único** dos dois lados, considerando autores de todos os anos da base. Casos ambíguos ficam sem ligação ("sem dado") até serem conferidos à mão no arquivo `packages/shared/src/config/emendas-autores.ts`. **Nunca por semelhança.**
- **Valores por ano do orçamento** (`Ano da Emenda`): empenhado, liquidado, pago e restos a pagar pagos.
- **Execução** = (pago + restos a pagar pagos) ÷ empenhado. Os restos a pagar pagos são pagamentos feitos nos anos seguintes ao do orçamento.
- **Por tipo:** "Transferências com Finalidade Definida" e "Transferências Especiais" (popularmente "emendas Pix").
- **Principais destinos:** os cinco locais (`Localidade de aplicação do recurso`) com maior valor empenhado.

### Limitações obrigatórias

- **Quem decide o ritmo de pagamento é o Poder Executivo, não o deputado.** A execução não é "eficiência do gabinete".
- Emendas de bancada, de comissão e de relator não entram (não pertencem a um único deputado).
- Em 22/10/2026, 19 deputados ficaram sem ligação: 12 têm o mesmo nome com dois códigos na base (de mandatos diferentes, aguardando conferência manual) e 7 não têm autor com o mesmo nome (posse recente ou licença, por exemplo).

<a id="frentes"></a>

## Frentes parlamentares

Quantas frentes parlamentares registradas na legislatura têm o deputado entre os membros, e quais ele coordena.

- Fontes: `frentes/json/frentes.json` (títulos) e `frentesDeputados/json/frentesDeputados.json` (membros; ~150 MB), filtrados pela 57ª legislatura.
- Coordenador: título "Coordenador" (o arquivo também traz a grafia "Coordernador", tratada como a mesma coisa).
- Algumas linhas de coordenador vêm só com o nome, sem o id do deputado (5 na legislatura, em 22/10/2026); elas são ignoradas, sem ligação por nome.
- **Limitação:** entrar numa frente é só assinar a adesão; a quantidade não mede envolvimento.

<a id="cargos"></a>

## Cargos na Câmara

- **Mesa Diretora:** `legislaturasMesas/json/legislaturasMesas.json`, cargos da 57ª legislatura.
- **Comissões e outros órgãos:** cargos diferentes de "Titular" e "Suplente" (presidente, vice-presidente, relator, coordenador...) no arquivo `orgaosDeputados-L57`, exceto a Mesa.
- **Lideranças:** API `GET /legislaturas/57/lideres` (líder, vice-líder, 1º vice-líder, representante...), com a bancada (partido, bloco, Governo, Maioria, Minoria, Oposição) e o período.
- Só cargos que tocam o período da legislatura até a data da atualização.
- **Limitação:** cargos dependem de acordos entre partidos e de eleições internas; vice-lideranças são numerosas e mudam com frequência.

<a id="perfil"></a>

## Perfil declarado

Profissões (`deputadosProfissoes`) e ocupações (`deputadosOcupacoes`) declaradas pelo próprio deputado à Câmara, como publicadas (inclusive datas de ocupação em texto livre). **Não é métrica**: é contexto.

<a id="votacoes-dos-jogos"></a>

## Votações usadas nos jogos

Três jogos (Placar, Vote você também e Seja deputado) mostram votações reais. Eles usam só as votações **elegíveis** (ADR 0019):

1. **Nominais de plenário** (as únicas com o voto de cada deputado registrado) e **não secretas**.
2. **De mérito:** a decisão sobre o conteúdo de uma proposição — o texto principal de um projeto de lei (PL, PLP), de uma PEC, de um projeto de decreto legislativo (PDL) ou de resolução (PRC), de uma medida provisória (MPV, inclusive na forma de projeto de lei de conversão) ou do texto que substitui o original por inteiro (substitutivo, subemenda substitutiva global, emenda aglutinativa substitutiva). Requerimentos (urgência, adiamento, retirada de pauta), recursos, destaques ("mantido o texto"), emendas isoladas (inclusive as do Senado), preferências, pareceres e redação final **ficam fora**: são difíceis de explicar e o jogador não teria como entender o que estava em jogo.
3. **Com proposição identificada:** a citada na descrição oficial do resultado (sigla, número e ano), procurada nas proposições ligadas à votação, nos arquivos de proposições da legislatura e, para projetos antigos, na API da Câmara. Projetos antigos renumerados pela Câmara (o PL 6.385/2016 é hoje o PL 2.721/2023) valem só quando a proposição ligada à votação é a única do mesmo tipo e foi apresentada no ano citado; o site mostra o número atual. Sem proposição identificável, a votação fica fora.

**Como separamos mérito de procedimento.** Os arquivos da Câmara não dizem isso diretamente. Usamos a **descrição oficial do resultado** (`descricao` no arquivo de votações), que segue um padrão estável: "Aprovado o Projeto de Lei nº…", "Aprovada, em segundo turno, a Proposta de Emenda à Constituição…", "Rejeitado o Requerimento.", "Mantido o texto.". Uma lista fechada de começos conta como mérito; todo o resto fica fora. Na dúvida, a votação fica fora. O resultado ainda tem de bater com o campo oficial `aprovacao`.

**Medição.** Uma amostra fixa de 120 votações nominais de plenário (30 de cada ano, de 2023 a 2026, sorteadas por um código do id) foi conferida uma a uma, lendo a descrição e a abertura da votação:

| Classificação                    | Votações | Conferência |
| -------------------------------- | -------: | ----------- |
| De mérito (elegíveis)            |       23 | 23 certas   |
| Procedimento, destaque ou emenda |       96 | 96 certas   |
| Secreta                          |        1 | certa       |

Na primeira versão da regra, 1 votação de mérito ficou de fora (PEC 45/2019, 1º turno, porque a proposição citada não estava ligada diretamente à votação). A busca na API corrigiu o caso; com ela, nenhum erro na amostra. A amostra não tem rejeitadas de mérito (são raras: veja abaixo).

**O que aparece no jogo:**

- **Descrição:** a ementa oficial, com sigla, número e ano (ex.: "PL 6.139/2023") e link para a página da proposição na Câmara. Quando houver um resumo em linguagem simples escrito ou revisado à mão (`content/resumos/`, campo `revisado: true`), ele aparece no lugar, com a ementa como fonte. Nenhum resumo é gerado por IA.
- **Resultado:** o campo oficial (aprovada ou rejeitada). Atenção: "aprovada" não é "mais Sim do que Não". Projeto de lei complementar precisa de **257** votos Sim (maioria absoluta) e PEC, de **308** (três quintos), em dois turnos. Ex.: o PLP 281/2019 teve 252 Sim e 176 Não em 14/10/2026 e foi rejeitado.
- **Placar:** o oficial do arquivo de votações (Sim, Não e outros) e, a partir dos votos individuais, abstenção, obstrução e Art. 17 (quem preside a sessão).
- **Voto de cada deputado:** só dos deputados em exercício hoje (os que têm ficha no site); quem não estava em exercício na data aparece como "sem voto registrado". Por isso a soma dos votos listados pode ser menor que o placar oficial.

**Números da legislatura** (em 22/10/2026): das 1.128 votações nominais de plenário, **216 são elegíveis** (49 em 2023, 46 em 2024, 89 em 2025 e 32 em 2026); 908 ficaram fora por serem de procedimento, destaque ou emenda, 3 por serem secretas e 1 por não ter proposição identificável. Por tipo: 96 PL, 58 PLP, 32 PEC, 15 PDL (um ainda com a sigla antiga, PDC), 13 MPV e 2 PRC. Só **2 foram rejeitadas** (PLP 223/2023 em 18/02/2025 e PLP 281/2019 em 14/10/2026). A lista completa está em [/jogos/votacoes](/jogos/votacoes).

**Limitações:**

- Quase tudo o que chega a uma votação nominal de mérito é aprovado (os acordos costumam ser feitos antes). Por isso o Placar pergunta como votou a maioria do seu estado, e não se a proposta passou.
- Uma votação é um momento de uma proposta que pode ter tido várias votações (primeiro e segundo turno, substitutivo e texto do Senado); cada uma aparece separada, com o turno quando houver.
- Se a Câmara mudar a forma de escrever as descrições, votações de mérito podem deixar de ser reconhecidas: elas ficam fora, nunca entram erradas.

### Jogos: regras de neutralidade

- Os jogos testam **conhecimento sobre o que aconteceu**, nunca opinião: nenhum texto diz que um voto é bom ou ruim.
- Não há jogo que compare deputados entre si ("quem gastou mais").
- **O voto do jogador é dele:** escolhas, sequência e estatísticas ficam só no navegador (`localStorage`). Nada é enviado.

<a id="jogo-dle"></a>

## Jogo 1 — Dle do seu estado

Adivinhar o deputado do dia entre os deputados em exercício do estado escolhido. Cada estado tem o seu sorteio (ADR 0020).

**Pistas** (só fatos que já estão no site ou no cadastro oficial; nenhuma soa como nota):

| Pista               | De onde vem                                                                                     | Verde          | Amarelo                     | Setas |
| ------------------- | ----------------------------------------------------------------------------------------------- | -------------- | --------------------------- | ----- |
| Partido             | partido atual (Câmara)                                                                          | mesmo partido  | partidos da mesma federação | —     |
| Condição            | titular, suplente ou suplente efetivado                                                         | igual          | —                           | —     |
| Na Câmara desde     | ano de início da primeira legislatura (arquivo `deputados.json`; 1951 + 4 × (legislatura − 39)) | igual          | —                           | sim   |
| Nasceu em           | ano de nascimento (`deputados.json`)                                                            | igual          | até 5 anos de diferença     | sim   |
| Estado natal        | UF de nascimento (`deputados.json`)                                                             | igual          | —                           | —     |
| Comissões (titular) | siglas das comissões em que é titular hoje (mesma regra da ficha)                               | mesmo conjunto | alguma em comum             | —     |
| Projetos (autor)    | projetos apresentados como autor principal na legislatura (mesma métrica da ficha)              | igual          | até 20% de diferença        | sim   |

**Fora de propósito:** gênero, gastos, presença, alinhamento e qualquer outra métrica que possa ser lida como "bom" ou "ruim". O número de mandatos não é usado porque não há contagem oficial (só a primeira e a última legislatura).

**Chutes:** 6 em estados com até 10 deputados, 8 até 30 e 10 acima de 30 (o tamanho da bancada vai de 8 a 70). O autocompletar mostra só os deputados do estado e ignora acentos. A foto borrada é uma dica opcional; a nítida aparece na revelação, com o link para a ficha.

**Limitação:** "na Câmara desde" conta a primeira legislatura, mesmo que a pessoa tenha ficado fora da Câmara depois.
