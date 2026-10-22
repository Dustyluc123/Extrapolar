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
  - Valores de `voto` encontrados: `Sim`, `Não`, `Abstenção`, `Obstrução`, `Artigo 17`.
  - Só traz votações **nominais** (de plenário e de comissões). Em 2023: 447 votações com votos individuais, 300 delas de plenário (de 1.090 votações de plenário no total; as demais são simbólicas).
- Horários sem fuso: são horário de Brasília.

### API (`https://dadosabertos.camara.leg.br/api/v2`)

| Endpoint                            | Uso                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /deputados?itens=100&pagina=N` | Deputados **em exercício** hoje (sem filtro de legislatura a API devolve só quem está em exercício; ~513)     |
| `GET /deputados/{id}/historico`     | Eventos do mandato (posse, licença, reassunção, troca de partido) usados para montar os períodos em exercício |

Formato conferido em 22/10/2026:

- `/deputados`: `{ "dados": [ { "id": 204379, "nome": "…", "siglaPartido": "MDB", "siglaUf": "AP", "idLegislatura": 57, "urlFoto": "https://www.camara.leg.br/internet/deputado/bandep/204379.jpg", "email": "…" | null } ], "links": [ … ] }`. Com `idLegislatura=57`, a lista traz todos que tiveram mandato na legislatura (~882), inclusive quem já saiu.
- `/deputados/{id}/historico`: `{ "dados": [ { "dataHora": "2023-09-13T14:53", "situacao": "Licença", "condicaoEleitoral": "Titular", "descricaoStatus": "Saída - Afastamento sem prazo determinado - Ministro de Estado", "idLegislatura": 57, "siglaPartido": "…", … } ] }`. A lista **não vem ordenada** e traz outras legislaturas.
  - Valores de `situacao` encontrados: `Exercício`, `Licença`, `CONVOCADO`, `SUPLENCIA`, `SUSPENSO`, `FIM_MANDATO`, `null`. A tabela oficial `/referencias/situacoesDeputado` lista: Afastado, Convocado, Exercício, Fim de Mandato, Licença, Suplência, Suspenso, Vacância. O histórico usa grafias diferentes da tabela (caixa alta, sem acento), então o pipeline normaliza antes de comparar.
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
