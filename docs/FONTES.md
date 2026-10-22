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

### API (`https://dadosabertos.camara.leg.br/api/v2`)

| Endpoint                                                 | Uso                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /deputados?itens=100&pagina=N`                      | Deputados **em exercício** hoje (sem filtro de legislatura a API devolve só quem está em exercício; ~513)     |
| `GET /blocos?idLegislatura=57` e `/blocos/{id}/partidos` | Federações e seus partidos (blocos comuns vêm sem partidos e sem datas; não usados, ADR 0014)                 |
| `GET /deputados/{id}/historico`                          | Eventos do mandato (posse, licença, reassunção, troca de partido) usados para montar os períodos em exercício |

Formato conferido em 22/10/2026:

- `/deputados`: `{ "dados": [ { "id": 204379, "nome": "…", "siglaPartido": "MDB", "siglaUf": "AP", "idLegislatura": 57, "urlFoto": "https://www.camara.leg.br/internet/deputado/bandep/204379.jpg", "email": "…" | null } ], "links": [ … ] }`. Com `idLegislatura=57`, a lista traz todos que tiveram mandato na legislatura (~882), inclusive quem já saiu.
- `/deputados/{id}/historico`: `{ "dados": [ { "dataHora": "2023-09-13T14:53", "situacao": "Licença", "condicaoEleitoral": "Titular", "descricaoStatus": "Saída - Afastamento sem prazo determinado - Ministro de Estado", "idLegislatura": 57, "siglaPartido": "…", … } ] }`. A lista **não vem ordenada** e traz outras legislaturas.
  - Valores de `situacao` encontrados: `Exercício`, `Licença`, `CONVOCADO`, `SUPLENCIA`, `SUSPENSO`, `FIM_MANDATO`, `null`. A tabela oficial `/referencias/situacoesDeputado` lista: Afastado, Convocado, Exercício, Fim de Mandato, Licença, Suplência, Suspenso, Vacância. O histórico usa grafias diferentes da tabela (caixa alta, sem acento), então o pipeline normaliza antes de comparar.
  - Alguns históricos trazem eventos marcados com a 57ª legislatura, mas datados antes de 01/02/2023 (8 casos em 22/10/2026; ex.: uma troca de partido de 31/03/2022). O pipeline ignora esses eventos e registra o número em `meta.json`.
  - `CONVOCADO` é o passo anterior à posse do suplente (ainda não está em exercício). `SUPLENCIA` é o suplente voltando à reserva quando o titular reassume.
  - Valores de `condicaoEleitoral` encontrados: `Titular`, `Suplente`, `EFETIVADO`, `null`.

## Fotos dos deputados

- Origem: URL oficial de cada deputado (`urlFoto`), servida por `https://www.camara.leg.br/internet/deputado/bandep/{id}.jpg`.
- O site **não copia nem altera** o arquivo: carrega a foto da URL oficial e aplica o tratamento de jornal (escala de cinza, contraste e retícula) só com CSS.
- Crédito exibido: "Foto: Câmara dos Deputados".
- TODO (Lucas): não encontrei as condições de uso específicas das fotos oficiais no portal de dados abertos. Conferir em https://www.camara.leg.br/ (ou pedir à Câmara pelo Fale Conosco) se o uso com crédito está liberado.

## Regimento Interno

- https://www2.camara.leg.br/atividade-legislativa/legislacao/regimento-interno-da-camara-dos-deputados
- TODO (Lucas): conferir o dispositivo que fundamenta o registro "Artigo 17" nas votações (citado em `docs/METODOLOGIA.md`).
