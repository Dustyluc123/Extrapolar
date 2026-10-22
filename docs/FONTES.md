# Fontes de dados

Toda informação exibida no Extrapolar vem de uma das fontes abaixo. Nenhum número é preenchido à mão.

## Câmara dos Deputados — Dados Abertos

- Portal: https://dadosabertos.camara.leg.br/
- Documentação da API: https://dadosabertos.camara.leg.br/swagger/api.html
- **Condições de uso:** o FAQ oficial (https://dadosabertos.camara.leg.br/faq/faq-home.html), consultado em 22/10/2026, diz, sobre cobrar por aplicativo ou serviço que use os dados: "Sim, pode. Não há qualquer restrição quanto ao isso." A página "Sobre dados abertos" (https://dadosabertos.camara.leg.br/howtouse/sobre-dados-abertos.html) lista, entre os princípios seguidos, dados "livres de licenças".
  - TODO (Lucas): não encontrei um documento formal de licença (como CC-BY). Conferir se existe e, se existir, citar aqui: https://dadosabertos.camara.leg.br/
- A Câmara recomenda os **arquivos estáticos** para cargas grandes e limita requisições por segundo na API.

### Arquivos estáticos (atualizados diariamente)

| Arquivo          | URL                                                                                       | Uso                                              |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Votações por ano | `https://dadosabertos.camara.leg.br/arquivos/votacoes/json/votacoes-{ano}.json`           | Lista de votações (órgão, data e hora, contagem) |
| Votos por ano    | `https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/json/votacoesVotos-{ano}.json` | Voto de cada deputado em cada votação nominal    |

Formato conferido em 22/10/2026 (amostra de 2023):

- `votacoes-{ano}.json`: `{ "dados": [ { "id": "2351332-7", "data": "2023-03-14", "dataHoraRegistro": "2023-03-14T19:20:56", "idOrgao": 180, "siglaOrgao": "PLEN", "votosSim": 366, "votosNao": 41, "votosOutros": 2, "descricao": "…", … } ] }`. O arquivo de um ano inclui as votações de janeiro, que pertencem à legislatura anterior quando o ano é de troca de legislatura.
- `votacoesVotos-{ano}.json`: `{ "dados": [ { "idVotacao": "1197773-90", "dataHoraVoto": "2023-08-09T19:27:16", "voto": "Sim", "deputado_": { "id": "220714", "nome": "…", "siglaPartido": "…", "siglaUf": "AM", "idLegislatura": "57", … } } ] }`.
  - Atenção: `deputado_.id` e `deputado_.idLegislatura` vêm como **texto**.
  - Valores de `voto` encontrados: `Sim`, `Não`, `Abstenção`, `Obstrução`, `Artigo 17` e `""` (vazio). O vazio aparece só em votações secretas (em 2025, votação `2576389-4`, eleição para o CNJ; em 2026, `2645346-18`, indicação ao TCU), com todos os votos vazios e o total igual à contagem oficial. Ver ADR 0008.
  - Votação secreta é reconhecida por `ultimaAberturaVotacao.descricao` ("Votação secreta em turno único.").
  - Conferência feita em 22/10/2026: nas 1.128 votações nominais de plenário da 57ª legislatura, o número de votos individuais no arquivo é igual a `votosSim + votosNao + votosOutros` do arquivo de votações.
  - Só traz votações **nominais** (de plenário e de comissões). Em 2023: 447 votações com votos individuais, 300 delas de plenário (de 1.090 votações de plenário no total; as demais são simbólicas).
- Horários sem fuso: são horário de Brasília.

### Arquivos estáticos — Fase 1, Caderno 1 (Plenário)

Formatos conferidos em 22/10/2026 (amostras de 2023 a 2026):

- `eventos/json/eventos-{ano}.json`: `{ "dados": [ { "id": 80865, "dataHoraInicio": "2025-12-22T16:52:06", "dataHoraFim": "…" | "", "situacao": "Encerrada (Final)", "descricao": "…", "descricaoTipo": "Reunião Deliberativa", "localCamara": {…}, … } ] }`.
  - `situacao`: `Encerrada`, `Encerrada (Final)`, `Encerrada (Termo)`, `Cancelada`. Os arquivos não trazem eventos futuros (conferido).
  - No plenário, `descricaoTipo`: `Sessão Deliberativa`, `Sessão Não Deliberativa Solene`, `Comissão Geral`, `Outro Evento`, `Sessão Preparatória - Eleição`/`- Posse`. Só as deliberativas têm presença registrada.
- `eventosOrgaos/json/eventosOrgaos-{ano}.json`: `{ "idEvento": 75481, "idOrgao": 539635, "siglaOrgao": "CEDESNAT", … }`. O plenário é `PLEN`. Alguns eventos têm mais de um órgão (reuniões conjuntas).
- `eventosPresencaDeputados/json/eventosPresencaDeputados-{ano}.json` (~30 MB por ano): `{ "idEvento": 74527, "dataHoraInicio": "…", "idDeputado": 204351 (número), … }`. Só registra **presenças** (não há registro de ausência nem de justificativa).
- `votacoesOrientacoes/json/votacoesOrientacoes-{ano}.json`: `{ "idVotacao": "…", "siglaOrgao": "PLEN", "siglaBancada": "PL", "orientacao": "Sim", … }`.
  - `orientacao`: `Sim`, `Não`, `Obstrução`, `Liberado` e `""` (sem orientação). `Abstenção` é aceito, mas não apareceu.
  - `siglaBancada` no plenário: lideranças (`Governo`, `Maioria`, `Minoria`, `Oposição`), partidos (às vezes abreviados: `Solidaried`, `Republican`; `Podemos` para o PODE), federações (`Fdr PT-PCdoB-PV`, `Fdr PSOL-REDE`, `Fdr PSDB-CIDADANIA`) e blocos com nome abreviado (`Bl UniPpFdrPsdbCid...`, `Bloco Parlamentar`). Ver ADR 0014.

### Arquivos estáticos — Fase 1, Caderno 2 (Comissões)

Formatos conferidos em 22/10/2026:

- `orgaos/json/orgaos.json` (sem ano): `{ "uri": ".../orgaos/2003", "sigla": "CCJC", "nome": "…", "apelido": "…", "tipoOrgao": "Comissão Permanente", "codTipoOrgao": 2, … }`. Tipos encontrados: Comissão Permanente, Comissão Especial, Comissão Parlamentar de Inquérito, Subcomissão, Comissão Externa, Grupo de Trabalho, Conselho, Comissão Mista (Permanente/Especial), Comissão Medida Provisória, COORDENADORIA DA MULHER, entre outros.
- `orgaosDeputados/json/orgaosDeputados-L57.json` (por legislatura): `{ "uriOrgao": ".../orgaos/4", "siglaOrgao": "MESA", "nomeOrgao": "…", "nomePublicacaoOrgao": "…", "uriDeputado": ".../deputados/178937", "cargo": "1º Vice-Presidente", "dataInicio": "2025-02-01", "dataFim": "" | "AAAA-MM-DD", … }`.
  - `cargo`: Titular, Suplente, Presidente, 1º/2º/3º Vice-Presidente, Relator, Coordenador e outros (43 valores).
  - Durante a presidência nem sempre há linha de "Titular"; há 4 linhas com data de fim anterior à de início (ignoradas). Alguns órgãos da lista não estão em `orgaos.json` (tipo "Não informado").
- `eventosRequerimentos/json/eventosRequerimentos-{ano}.json`: `{ "idEvento": 75406, "tituloRequerimento": "REQ 338/2025", "uriRequerimento": ".../proposicoes/2483487" }`. Quase todos são REQ (também SUG, PL, REP); até 27 requerimentos por evento.
- `proposicoesAutores/json/proposicoesAutores-{ano}.json` (~79 MB por ano): `{ "idProposicao": 2646600, "idDeputadoAutor": 204379 (só para deputados), "codTipoAutor": 10000, "tipoAutor": "Deputado(a)", "nomeAutor": "…", "ordemAssinatura": "1", "proponente": "1" | "0", … }`.
  - `ordemAssinatura = "1"` é o primeiro signatário (único por proposição, conferido).
  - `proponente = "0"` aparece só em assinaturas de deputados que não são o primeiro: são assinaturas de apoio.

### Arquivos estáticos — Fase 1, Caderno 3 (Projetos e leis)

Formatos conferidos em 22/10/2026:

- `proposicoes/json/proposicoes-{ano}.json` (**~160 MB** em 2025; o download às vezes cai no meio e o pipeline tenta de novo): `{ "id": 106701, "siglaTipo": "PL", "codTipo": 139, "descricaoTipo": "Projeto de Lei", "ementa": "…", "dataApresentacao": "2025-…T…:…:…", "uriPropPrincipal": "" | ".../proposicoes/{id}", "uriOrgaoNumerador": ".../orgaos/{id}", "ultimoStatus": { "idSituacao": "915" | "", "descricaoSituacao": "Aguardando Parecer", … }, … }`.
  - Traz **tudo** o que foi apresentado no ano, de todos os tipos (RPD, PRL, REQ, RIC, EMC, PL, PAR, INC...). Em 2025, 107.587 proposições, das quais 6.540 PL.
  - 58 proposições do arquivo de 2025 têm `dataApresentacao` antiga (renumeradas ao chegar do Senado); o campo `ano` vem 0 para a maioria dos tipos acessórios.
  - Subtipos de requerimento identificados por `codTipo` (ex.: 294 Audiência Pública, 523 Convocação de Ministro na Comissão, 356 Convocação de Ministro no Plenário, 150 Convocação de Autoridade).
  - Pareceres de relator (PRL, PRLP, PRLE): todos com um único autor, o relator.
- `proposicoesTemas/json/proposicoesTemas-{ano}.json`: `{ "uriProposicao": ".../proposicoes/106701", "codTema": 48, "tema": "Meio Ambiente e Desenvolvimento Sustentável", "relevancia": 0 }`. Até 12 temas por proposição.
- API `/referencias/proposicoes/codTema`: 32 temas oficiais, entre eles **72 — Homenagens e Datas Comemorativas**.

### API (`https://dadosabertos.camara.leg.br/api/v2`)

| Endpoint                                                         | Uso                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /deputados?itens=100&pagina=N`                              | Deputados **em exercício** hoje (sem filtro de legislatura a API devolve só quem está em exercício; ~513)     |
| `GET /blocos?idLegislatura=57` e `/blocos/{id}/partidos`         | Federações e seus partidos (blocos comuns vêm sem partidos e sem datas; não usados, ADR 0014)                 |
| `GET /deputados/{id}/historico`                                  | Eventos do mandato (posse, licença, reassunção, troca de partido) usados para montar os períodos em exercício |
| `GET /deputados/{id}/discursos?dataInicio=…&dataFim=…&itens=100` | Discursos (não há arquivo estático; atualização semanal, ADR 0015)                                            |

Formato conferido em 22/10/2026:

- `/deputados`: `{ "dados": [ { "id": 204379, "nome": "…", "siglaPartido": "MDB", "siglaUf": "AP", "idLegislatura": 57, "urlFoto": "https://www.camara.leg.br/internet/deputado/bandep/204379.jpg", "email": "…" | null } ], "links": [ … ] }`. Com `idLegislatura=57`, a lista traz todos que tiveram mandato na legislatura (~882), inclusive quem já saiu.
- `/deputados/{id}/historico`: `{ "dados": [ { "dataHora": "2023-09-13T14:53", "situacao": "Licença", "condicaoEleitoral": "Titular", "descricaoStatus": "Saída - Afastamento sem prazo determinado - Ministro de Estado", "idLegislatura": 57, "siglaPartido": "…", … } ] }`. A lista **não vem ordenada** e traz outras legislaturas.
  - Valores de `situacao` encontrados: `Exercício`, `Licença`, `CONVOCADO`, `SUPLENCIA`, `SUSPENSO`, `FIM_MANDATO`, `null`. A tabela oficial `/referencias/situacoesDeputado` lista: Afastado, Convocado, Exercício, Fim de Mandato, Licença, Suplência, Suspenso, Vacância. O histórico usa grafias diferentes da tabela (caixa alta, sem acento), então o pipeline normaliza antes de comparar.
  - Alguns históricos trazem eventos marcados com a 57ª legislatura, mas datados antes de 01/02/2023 (8 casos em 22/10/2026; ex.: uma troca de partido de 31/03/2022). O pipeline ignora esses eventos e registra o número em `meta.json`.
  - `CONVOCADO` é o passo anterior à posse do suplente (ainda não está em exercício). `SUPLENCIA` é o suplente voltando à reserva quando o titular reassume.
  - Valores de `condicaoEleitoral` encontrados: `Titular`, `Suplente`, `EFETIVADO`, `null`.

### API — discursos (Fase 1, Caderno 5)

Formato conferido em 22/10/2026: `{ "dados": [ { "dataHoraInicio": "2026-09-02T11:36" (sem segundos), "dataHoraFim": null, "uriEvento": "", "faseEvento": { "titulo": "Ordem do Dia" | null, … }, "tipoDiscurso": "PELA ORDEM", "sumario": "…" | null, "transcricao": "…", "keywords": "…" | null, "urlTexto": … } ], "links": [ … ] }`.

- Não existe `discursos-{ano}.json` nos arquivos estáticos (404).
- Cerca de 4 KB por discurso (a transcrição vem junto); ~1,5 s por página de 100.
- Erro 500 persistente para alguns períodos de alguns deputados (em 22/10/2026: 29 meses de 24 deputados, todos entre agosto e outubro de 2026); o pipeline divide a consulta e registra o mês como indisponível (ADR 0015).
- Fases encontradas: Ordem do Dia, Breves Comunicações, Encerramento, Homenagem, Comissão Geral, Abertura e fase vazia.

## Fase 1, Caderno 6 — Dinheiro público

### Cota parlamentar (Câmara)

- `https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip` (~6 MB por ano; `Last-Modified` diário). Dentro, um CSV em UTF-8 com BOM, separado por `;`, todos os campos entre aspas; alguns campos têm `;` dentro das aspas (por isso o pipeline usa um leitor de CSV completo).
- Campos usados: `ideCadastro` (id do deputado na API; vazio para lideranças), `numAno`, `numMes` (competência), `numSubCota` e `txtDescricao` (categoria, 18 valores em 2025), `sgUF`, `vlrLiquido` (decimal com ponto; pode ser negativo), `vlrRestituicao` (vazio em todos os registros de 2025).
- Significado dos campos: [Dados abertos — CEAP](https://dadosabertos.camara.leg.br/howtouse/2023-12-26-dados-ceap.html).
- Teto por UF: [Cota Parlamentar — guia para jornalistas](https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/cota-parlamentar) ("valores atuais", sem data) e [Ato da Mesa nº 244/2026](https://www2.camara.leg.br/legin/int/atomes/2026/atodamesa-244-20-fevereiro-2026-798720-norma-cd-mesa.html). TODO (Lucas): conferir a tabela no Diário da Câmara de 20/02/2026, p. 2216, e achar a tabela vigente de fev/2023 a fev/2026 (ADR 0017).

### Funcionários (Câmara)

- `https://dadosabertos.camara.leg.br/arquivos/funcionarios/json/funcionarios.json` (~7 MB): retrato do dia anterior, sem histórico. Campos usados: `grupo` ("Secretário Parlamentar", "Cargo de Natureza Especial", "Quadro Efetivo - RJU", "Parlamentar") e `uriLotacao` (para secretários: `.../deputados/{id}`). O arquivo traz nomes de pessoas; o site só publica a contagem.
- Limite de 5 a 25 por gabinete: [Ato da Mesa nº 72/1997](https://www2.camara.leg.br/legin/int/atomes/1997/atodamesa-72-16-setembro-1997-321031-normaatualizada-cd-mesa.html), art. 7º.

### Emendas parlamentares (CGU)

- Download em lote: `https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO` (redireciona para `dadosabertos-download.cgu.gov.br/.../EmendasParlamentares.zip`, ~33 MB). Dentro: `EmendasParlamentares.csv` (~47 MB, ISO-8859-1, CRLF), `EmendasParlamentares_Convenios.csv` e `EmendasParlamentares_PorFavorecido.csv` (não usados).
- Campos usados: `Ano da Emenda`, `Tipo de Emenda` (Individual — Transferências com Finalidade Definida, Individual — Transferências Especiais, de Relator, de Bancada, de Comissão), `Código do Autor da Emenda`, `Nome do Autor da Emenda`, `Localidade de aplicação do recurso`, `Valor Empenhado`, `Valor Liquidado`, `Valor Pago`, `Valor Restos A Pagar Pagos` (vírgula decimal).
- Condições de uso: TODO (Lucas): conferir a licença dos dados do Portal da Transparência.

## Fotos dos deputados

- Origem: URL oficial de cada deputado (`urlFoto`), servida por `https://www.camara.leg.br/internet/deputado/bandep/{id}.jpg`.
- O site **não copia nem altera** o arquivo: carrega a foto da URL oficial e aplica o tratamento de jornal (escala de cinza, contraste e retícula) só com CSS.
- Crédito exibido: "Foto: Câmara dos Deputados".
- TODO (Lucas): não encontrei as condições de uso específicas das fotos oficiais no portal de dados abertos. Conferir em https://www.camara.leg.br/ (ou pedir à Câmara pelo Fale Conosco) se o uso com crédito está liberado.

## Regimento Interno

- https://www2.camara.leg.br/atividade-legislativa/legislacao/regimento-interno-da-camara-dos-deputados
- TODO (Lucas): conferir o dispositivo que fundamenta o registro "Artigo 17" nas votações (citado em `docs/METODOLOGIA.md`).
