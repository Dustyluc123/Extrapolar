# Relatório — Fase 1 (rascunho em andamento)

> Rascunho atualizado a cada etapa; a versão final substitui este cabeçalho.

## Etapas

### Etapa 1 — Base (`ecc6894`)

- Dados por deputado (`deputados/{id}.json`), `metricas.json` (Fase 2) e `MetricValue` padronizado com motivos de "sem dado" (ADR 0012).
- Ficha em cadernos, bloco `Metric.astro`, `NoData.astro`, navegação entre cadernos.
- Gráficos: `Columns` (SVG), `BarList` e `Timeline` (HTML/CSS), `ChartFigure` com tabela (ADR 0013).
- `/glossario` (9 termos iniciais), `Term.astro`.
- `formatBRL`, `formatBRLCompact`; `pnpm repo-growth`.
- Crescimento medido na migração (uma vez só): 141 KB comprimidos.

### Etapa 2 — Plenário

- Presença em sessões deliberativas: 392 sessões (PLEN, "Sessão Deliberativa", "Encerrada…"); mediana 93,9%, mínimo 43,1%; 39 presenças fora do período (contadas).
- Alinhamento com o partido (partido → federação; bloco não, ADR 0014): mediana 98,5%; 37 deputados "sem dado"; União/PP/MDB/Republicanos/Podemos com 14 a 41 votações comparáveis em média.
- Alinhamento com o Governo: Governo orientou em 1.127 de 1.128 votações; mediana 81,2%, mínimo 16,8%.
- Conferido: todos os nomes de bancada de partido batem com exatamente um partido (abreviações "Solidaried", "Republican", "Podemos"=PODE).
- Chrome 155 demorou para abrir no headless; espera do script de 10 s para 30 s.

### Etapa 3 — Comissões

- 5.538 reuniões de comissão; mediana de 2 comissões como titular hoje (53 deputados com zero); presença em comissões com mediana de 57%; 13 deputados nunca titulares (ministros licenciados, Mesa, suplentes recentes).
- Eventos a pedido: mediana 8, máximo 204; 12 requerimentos sem autoria na legislatura.
- Linha do tempo com vários trechos por comissão; comissões só de suplência numa lista recolhida.
- Script de capturas aceita âncora (`/deputados/ID#caderno`) e passa por about:blank antes de navegar (navegação só de âncora travava).

### Etapa 4 — Projetos e leis

- Proposições (PL, PLP, PEC, PDL, PRC): mediana de 24 como autor principal (16 deputados com zero; máximo 1.223); 159 viraram norma no total; taxa de conversão com mediana 0%.
- Situação: todos os 36 códigos encontrados de 2023 a 2026 classificados em 8 categorias.
- Temas oficiais (32) com "Homenagens e Datas Comemorativas" (código 72) separado pelo nome oficial.
- Pareceres de relator: viável (PRL/PRLP/PRLE têm um único autor, o relator); mediana 26; membros da Mesa chegam a 10.807 (pareceres sobre requerimentos de informação).
- Download com nova tentativa quando a conexão cai no meio do corpo (aconteceu com o arquivo de 160 MB).
- Heap do pipeline aumentada para 6 GB (arquivos de proposições).

### Etapa 5 — Fiscalização

- RIC (mediana 2, máximo 4.966), PFC (166 no total), convocações pelos tipos oficiais 523/356/150 (1.208 como autor principal) e indicações (mediana 2) mostradas à parte como "sugestões ao governo".
- Série trimestral de RIC + PFC (16 trimestres).
- Convocações: viável por tipo oficial (codTipo), sem busca por palavras na ementa — não foi preciso medir precisão.

### Etapa 6 — Voz

- Discursos pela API (sem arquivo estático): ~800 requisições, cache de 7 dias (atualização semanal), primeira carga ~12 min; diário com cache ~1 min no total do pipeline.
- API com erro 500 persistente em alguns períodos: coleta dividida em anos e meses; 29 meses de 24 deputados (ago–out/2026) ficaram indisponíveis e aparecem na ficha.
- Mediana de 33 discursos; 25 deputados sem discurso; máximo 1.819.
- Cache de discursos reduzido: 6,9 MB (sem transcrição nem resumo).

### Etapa 7 — Dinheiro público

- Cota: 4 arquivos anuais (zip com CSV); mediana de R$ 1,48 mi na legislatura; proporção do teto só em 2026 (mar até o mês anterior), mediana ~51%.
- Equipe: secretários parlamentares do retrato do dia anterior; de 5 a 25; 3 deputados "sem dado".
- Emendas (CGU, download em lote sem chave): 494 deputados ligados; mediana de R$ 110 mi empenhados (orçamentos 2024–2026); execução mediana 87%.
- Leitor de CSV completo (o CSV da cota tem `;` dentro de campos), cache de bytes para os zips, `fflate` para descompactar.
- Corrigido "R$ 1.000 mil" na formatação compacta.

### Etapa 8 — Articulação e perfil

- Frentes: mediana de 109 por deputado; 198 coordenam alguma; títulos num índice `frentes.json` (29 KB) para não repetir nos 513 arquivos.
- Cargos: Mesa (22 deputados), presidências/relatorias em órgãos, lideranças pela API `/legislaturas/57/lideres` (paginada até o fim).
- Perfil: profissões (506 deputados) e ocupações (298), como declaradas.
- 5 linhas de coordenador de frente sem id do deputado: ignoradas (sem ligação por nome).

### Etapa 9 — Ficha completa e design mais leve

- Resumo em números (6 fixos para todos: participação, presença, projetos, RIC, comissões hoje, cota).
- "Traduzindo:" em cada métrica (frases sem pronome de gênero), carimbos, recortes de papel, sublinhado à mão, glossário como "Classificados" (42 termos, índice por letra), "Errata" no Sobre, 404 simpática, "Sem dado" com "Regra da casa".
- Animações ligadas à rolagem, sem JS, com ponto de partida nunca invisível; desligadas em reduced-motion. Scripts de captura e acessibilidade emulam reduced-motion.
- Ficha: ~24 KB comprimida; CSS 7,6 KB; site com 518 páginas.

## Decisões (marcar ⚠ as que mudam números ou o que o leitor vê)

- ⚠ Orientação de bloco não usada (decidido no planejamento); efeito grande em partidos que orientam pelo bloco — ADR 0014.
- ⚠ Partido considerado no alinhamento = partido na data da votação (registrado no voto), não o atual.
- ⚠ Alinhamento conta só votações em que votou Sim/Não/Abstenção/Obstrução e a orientação foi uma dessas; liberado, sem orientação, só bloco, Art. 17 e secreto ficam fora e aparecem contados na ficha.
- ⚠ Presença: só "Sessão Deliberativa" encerrada do PLEN; presença fora do período conta (mesma regra da participação).
- ⚠ "Comissão" = Permanente, Especial ou CPI; "titular" inclui presidente e vices (a linha de Titular some durante a presidência).
- ⚠ Presença em comissões só com os 8 tipos de reunião com presença regularmente registrada; seminários, mesas-redondas, visitas etc. fora.
- ⚠ Eventos a pedido: autor = proponente em qualquer posição (apoio não conta); evento conta uma vez por deputado.
- ⚠ Projetos = PL, PLP, PEC, PDL e PRC; autor principal = ordemAssinatura 1; coautor = demais proponentes; apoio (proponente 0) não é autoria.
- ⚠ Taxa de conversão = viraram norma (código 1140) ÷ apresentados como autor principal na legislatura; tabela de códigos de situação na metodologia.
- ⚠ Temas: projeto conta em cada tema; homenagens pelo tema oficial 72, sem classificação própria.
- ⚠ Pareceres: PRL + PRLP + PRLE de autoria do deputado, por órgão numerador (inclui a Mesa).
- ⚠ Fiscalização conta autor principal como número principal (coautoria à parte), igual aos projetos.
- ⚠ Convocação = só os 3 tipos oficiais de requerimento; convites (audiência pública) ficam fora.
- ⚠ Discursos com atualização semanal (ADR 0015); a ficha mostra a data da consulta.
- ⚠ A ficha não reproduz o conteúdo nem os resumos oficiais dos discursos, só contagens e a data do último (ADR 0016): os resumos traziam acusações contra terceiros citados pelo nome.
- ⚠ Cota: gasto = soma de vlrLiquido por mês de competência; restituições à parte, sem desconto.
- ⚠ Teto: só mar/2026 em diante (página oficial, a conferir no Diário); fev/2023–fev/2026 null; mês corrente fora da comparação (ADR 0017).
- ⚠ Equipe: zero secretários no arquivo = "sem dado" (abaixo do mínimo legal de 5).
- ⚠ Emendas: só individuais; orçamentos 2024+; ligação estrita por nome único (todos os anos); execução inclui restos a pagar pagos (ADR 0018).
- ⚠ Frentes: linhas sem id do deputado ignoradas; "Coordernador" = coordenador.
- ⚠ Resumo em números fixo (decidido no plano); "Traduzindo:" com tom leve, sem humor sobre deputados ou partidos.
- Aviso de "base pequena" (< 30) generalizado para todas as porcentagens (componente FewNotice).

- Gráficos de barras e linha do tempo em HTML+CSS em vez de SVG (rótulos longos quebram linha no celular) — ADR 0013.

## Fora do escopo / não viável

## TODOs para o Lucas

### Emendas: deputados sem ligação (conferir e, se for o caso, preencher `packages/shared/src/config/emendas-autores.ts`)

- Aécio Neves (id 74646): código 2889, anos 2015, 2016, 2017, 2018, 2019; código 1349, anos 2020, 2021, 2022, 2023, 2024, 2025, 2026
- Antonio Andrade (id 220544): código 2473, anos 2015; código 4305, anos 2024, 2025, 2026
- Átila Lira (id 123086): código 1935, anos 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023; código 4309, anos 2024, 2025, 2026
- Bebeto (id 220612): código 3028, anos 2016, 2017, 2018, 2019; código 4312, anos 2024, 2025, 2026
- Dr Flávio (id 227991): nenhum autor com esse nome na base
- Eunício Oliveira (id 74454): código 2894, anos 2015, 2016, 2017, 2018, 2019; código 3520, anos 2024, 2025, 2026
- Gilmar Machado (id 74581): nenhum autor com esse nome na base
- Gleisi Hoffmann (id 107283): código 2911, anos 2015, 2016, 2017, 2018, 2019; código 4011, anos 2020, 2021, 2022, 2023, 2024, 2025
- Itamar Paim (id 225846): nenhum autor com esse nome na base
- José Medeiros (id 204472): código 3792, anos 2016, 2017, 2018, 2019; código 4153, anos 2020, 2021, 2022, 2023, 2024, 2025, 2026
- Leonardo Gadelha (id 122195): nenhum autor com esse nome na base
- Lídice da Mata (id 139285): código 2879, anos 2015, 2016, 2017, 2018, 2019; código 2468, anos 2020, 2021, 2022, 2023, 2024, 2025, 2026
- Lindbergh Farias (id 74858): código 2881, anos 2015, 2016, 2017, 2018, 2019; código 3273, anos 2024, 2025, 2026
- Marcelo Crivella (id 220599): código 2010, anos 2015, 2016, 2017; código 4416, anos 2024, 2025, 2026
- Marina Silva (id 220637): nenhum autor com esse nome na base
- Priscila Costa (id 226075): nenhum autor com esse nome na base
- Rodrigo Rollemberg (id 141533): código 2916, anos 2015; código 2553, anos 2026
- Sônia Guajajara (id 220643): nenhum autor com esse nome na base
- Yury Bruno (id 220660): nenhum autor com esse nome na base

### Emendas: autores de emendas individuais (2024 em diante) sem deputado atual correspondente (142)

Senadores, ex-deputados e os casos ambíguos acima. Gerado com `EXTRAPOLAR_LIST_UNLINKED=1 pnpm pipeline`.

<details><summary>Lista completa</summary>

- AECIO NEVES [1349]
- ALAN RICK [4394]
- ALESSANDRO VIEIRA [4144]
- ALEX SANTANA [3906]
- ALINE GURGEL (EX-PARLAMENTAR JOSE AUGUSTO PUPPIO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4310]
- AMALIA BARROS [4297]
- ANA PAULA LOBATO [4283]
- ANDRE ABDON (EX-PARLAMENTAR SONIZE BARBOSA, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4481]
- ANGELO CORONEL [4179]
- ANTONIO ANDRADE [4305]
- ASTRONAUTA MARCOS PONTES [4265]
- ATILA LIRA [4309]
- AUGUSTA BRITO [4281]
- BEBETO [4312]
- BETO FARO [4266]
- CARLA DICKSON (EX-PARLAMENTAR PAULINHO FREIRE, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4443]
- CARLA ZAMBELLI [3928]
- CARLOS FAVARO [4201]
- CARLOS PORTINHO [4210]
- CARLOS VIANA [4087]
- CHICO RODRIGUES [4143]
- CHIQUINHO BRAZAO [3941]
- CID GOMES [4081]
- CIRO NOGUEIRA [2900]
- CLEITINHO [4267]
- CONFUCIO MOURA [4092]
- CORONEL TELHADA [4329]
- DAMARES ALVES [4268]
- DANIELLA RIBEIRO [4141]
- DAVI ALCOLUMBRE [3787]
- DAYANY BITTENCOURT [4340]
- DR. ALLAN GARCES [4511]
- DR. BENJAMIM [4359]
- DR. FLAVIO (EX-PARLAMENTAR DELEGADO RAMAGEM, NOS TERMOS DA DECISAO ADPF 854, DE 03 [4351]
- DR. HIRAN [4269]
- DRA. EUDOCIA [4239]
- DRA. MAYRA PINHEIRO [4543]
- EDUARDO BRAGA [2909]
- EDUARDO GIRAO [4138]
- EDUARDO GOMES [4186]
- EFRAIM FILHO [4270]
- ELIZIANE GAMA [4139]
- ELY SANTOS [4229]
- ENFERMEIRA REJANE (EX-PARLAMENTAR WASHINGTON QUAQUA, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4489]
- ESPERIDIAO AMIN [2210]
- EUNICIO OLIVEIRA [3520]
- FABIANO CONTARATO [4180]
- FATIMA PELAES [4559]
- FERNANDO DUEIRE [4252]
- FERNANDO FARIAS [4285]
- FLAVIO ARNS [2038]
- FLAVIO BOLSONARO [9219]
- GEOVANIA DE SA (EX-PARLAMENTAR CARMEN ZANOTTO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [2925]
- GIACOBO [1968]
- GIORDANO [4221]
- GLEISI HOFFMANN [4011]
- GUILHERME BOULOS [4386]
- HAMILTON MOURAO [4271]
- HUMBERTO COSTA [2885]
- IRAJA [4096]
- IVAN VALENTE [3228]
- IVETE DA SILVEIRA [4251]
- IZALCI LUCAS [4136]
- JADER BARBALHO [2263]
- JAIME BAGATTOLI [4272]
- JAQUES WAGNER [4080]
- JAYME CAMPOS [2376]
- JOAO CURY NETO (EX-PARLAMENTAR ALBERTO MOURAO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [3597]
- JORGE KAJURU [9206]
- JORGE SEIF [4273]
- JOSE GUIMARAES [2442]
- JOSE MEDEIROS [4153]
- JUSSARA LIMA [4496]
- LAERCIO OLIVEIRA [4274]
- LEILA BARROS [4082]
- LENIR DE ASSIS [4553]
- LEO PRATES [4408]
- LEONIDAS CRISTINO [3270]
- LIDICE DA MATA [2468]
- LINDBERGH FARIAS [3273]
- LUCAS BARRETO [4079]
- LUIS CARLOS HEINZE [4184]
- MAGNO MALTA [2029]
- MARA GABRILLI [4094]
- MARCELO CASTRO [4183]
- MARCELO CRIVELLA [4416]
- MARCIO BITTAR [4078]
- MARCIO CORREA [4509]
- MARCIVANIA FLEXA (EX-PARLAMENTAR MARIA GORETH, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4450]
- MARCOS DO VAL [9204]
- MARCOS ROGERIO [9224]
- MECIAS DE JESUS [4093]
- MISSIONARIO JOSE OLIMPIO (EX-PARLAMENTAR EDUARDO BOLSONARO, NOS TERMOS DA DECISAO ADPF 854, DE 03 [3088]
- NELSINHO TRAD [4181]
- NEWTON BONIN [4542]
- ODAIR CUNHA [1407]
- OMAR AZIZ [3794]
- ORIOVISTO GUIMARAES [4089]
- OSSESIO SILVA [4050]
- OTTO ALENCAR [3795]
- OTTO ALENCAR FILHO [4123]
- PAULO LEMOS (EX-PARLAMENTAR SILVIA WAIAPI, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4477]
- PAULO MARINHO JR [2960]
- PAULO PAIM [2023]
- PLINIO VALERIO [4137]
- PROF. PAULO FERNANDO [4497]
- PROFESSORA DORINHA SEABRA [4275]
- RAFAEL BENTO (EX-PARLAMENTAR LEBRAO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4406]
- RANDOLFE RODRIGUES [2919]
- REGINETE BISPO [4455]
- RENAN CALHEIROS [2289]
- RIBAMAR ANTONIO DA SILVA (EX-PARLAMENTAR RICARDO SILVA, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4200]
- RODRIGO CUNHA [4178]
- RODRIGO DA ZAELI (EX-PARLAMENTAR ABILIO BRUNINI, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4290]
- RODRIGO PACHECO [4140]
- RODRIGO ROLLEMBERG [2553]
- RODRIGO ROLLEMBERG (EX-PARLAMENTAR GILVAN MAXIMO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4385]
- ROGERIO CARVALHO [4095]
- ROGERIO MARINHO [4276]
- ROMARIO [3799]
- ROMERO RODRIGUES [2714]
- ROSEANA SARNEY [1651]
- SAMUEL SANTOS [4560]
- SERGIO MORO [4277]
- SERGIO PETECAO [2914]
- SILVIO ANTONIO [4513]
- SORAYA THRONICKE [4086]
- STYVENSON VALENTIM [4142]
- TADEU OLIVEIRA [4544]
- TERESA LEITAO [4278]
- TEREZA CRISTINA [4279]
- TIAGO DIMAS (EX-PARLAMENTAR LAZARO BOTELHO, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [2429]
- VANDERLAN CARDOSO [4083]
- VENEZIANO VITAL DO REGO [4088]
- VICENTINHO [1997]
- WELLINGTON FAGUNDES [3805]
- WEVERTON [4084]
- WILDER MORAIS [2969]
- YURY DO PAREDAO [4491]
- ZE ADRIANO (EX-PARLAMENTAR GERLEN DINIZ, NOS TERMOS ART. 78 LDO 2025 E DA MENSAGEM 95-CN, DE 06.11.25) [4382]
- ZENAIDE MAIA [4091]
- ZEQUINHA MARINHO [4182]

</details>

## Medidas

- Pipeline (Fase 0, com cache): ~7 s; sem cache: ~2 min 20 s.
