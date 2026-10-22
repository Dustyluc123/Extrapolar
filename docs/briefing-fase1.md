# Briefing — Fase 1 do Extrapolar: todas as métricas + design mais leve

> Briefing original da Fase 1, mantido como registro. O plano aprovado está em `docs/PLANO-FASE1.md`; o resultado, em `docs/RELATORIO-FASE1.md`.

---

A Fase 0 ficou excelente. Agora vamos transformar a ficha de cada deputado no retrato mais completo possível do trabalho dele, com todas as métricas que tenham dado oficial, e deixar o visual um pouco menos sério.

## 0. Como vamos trabalhar a partir de agora

1. **Planejamento:** leia este briefing, me apresente o plano e faça **todas** as perguntas que precisar de uma vez, agora, no começo.
2. **Execução:** depois que eu aprovar, execute **todas as etapas em sequência, sem parar**, com um commit por etapa (como na noite da Fase 0).
3. **Durante a execução, não me pergunte nada.** Se surgir uma dúvida, tome a decisão mais simples e conservadora, registre num ADR em `docs/decisoes/` e siga. Decisões que mudam números exibidos ou o que o leitor vê devem ser marcadas com ⚠ no relatório.
4. Você pode ler e escrever fora da pasta do projeto quando precisar (cache, temporários), mas **nunca** faça `git push`, nunca apague nada que não tenha criado e nunca mexa em configurações globais da máquina.
5. **Relatório final** em `docs/RELATORIO-FASE1.md`, no mesmo formato do `RELATORIO-NOITE.md`: o que foi feito por etapa, decisões tomadas sozinho (⚠ primeiro), o que ficou de fora e por quê, TODOs que dependem de mim e como testar.

Os princípios do `CLAUDE.md` continuam valendo em tudo, principalmente: neutralidade, todo número verificável, **nunca inventar dados**, custo perto de zero.

## 1. Regras gerais para todas as métricas

- **Todos os deputados em exercício têm todas as métricas.** Quando um valor não puder ser calculado para alguém, a ficha mostra "sem dado" com o motivo (por exemplo, "assumiu há menos de 30 dias"). Nunca mostre 0 no lugar de "sem dado".
- **Antes de implementar cada métrica, baixe uma amostra real da fonte e confira os campos**, como você fez na Fase 0. Nada de nomes de campo de memória.
- **Prefira os arquivos estáticos da Câmara** (`dadosabertos.camara.leg.br/arquivos/...`, atualização diária) à API. Use a API só quando não houver arquivo, com o cliente HTTP que já existe (pausa, concorrência baixa, retry, cache).
- **Período:** legislatura atual (57ª), respeitando os períodos em exercício de cada deputado, como na participação. Para dinheiro, mostre também o recorte por ano.
- **Cada métrica tem, na ficha:**
  1. o número principal, tratado como manchete;
  2. um gráfico quando ajudar a entender (ver seção 4);
  3. **"O que é isso?"**: uma ou duas frases em linguagem simples, para quem nunca acompanhou política;
  4. **"O que este número não mostra"**: as limitações;
  5. fonte oficial, data de atualização e link para a seção correspondente em `/metodologia`.
- **Funções puras em `packages/metrics`, com testes**, para cada métrica (casos normais, período parcial, sem dado, dados estranhos). Pipeline só orquestra.
- **Validação com Zod** de toda fonte nova. Campo inesperado = pipeline para com mensagem clara, como na Fase 0.
- **`docs/METODOLOGIA.md`** ganha uma seção por métrica: definição, fórmula, fonte, limitações, decisões. É a mesma página que aparece no site.
- **`docs/FONTES.md`** ganha cada fonte nova, com link e formato conferido.
- **Dados para a futura função de ordenação:** guarde o valor bruto e o denominador de cada métrica de forma estruturada, para que a Fase 2 ("monte seu ranking") consiga ordenar sem recalcular. **Não** construa ranking, comparação entre deputados ou média nesta fase (ADR 0010 continua valendo).

## 2. Métricas a implementar

Organize a ficha em "cadernos", como um jornal. Abaixo, o que entra em cada um. A sigla ou o nome do arquivo é ponto de partida; confira na fonte.

### Caderno 1 — Plenário

1. **Participação em votações nominais** (já existe). Manter.
2. **Presença em sessões deliberativas do plenário.** Fonte: `eventos-{ano}` + `eventosOrgaos-{ano}` + `eventosPresencaDeputados-{ano}`. Diferente de votar: mede se o deputado registrou presença. Use só eventos realizados (os arquivos também listam eventos futuros com os "esperados"; exclua).
3. **Alinhamento com a orientação do próprio partido.** Fonte: `votacoesOrientacoes-{ano}` + votos. Porcentagem das votações nominais em que o voto coincidiu com a orientação da bancada do partido dele (excluir "Liberado" e votações sem orientação). Explicar que alinhamento alto ou baixo não é bom nem ruim.
4. **Alinhamento com a orientação do Governo.** Mesmo cálculo, usando a orientação da liderança do Governo. Texto estritamente descritivo, sem dizer se é bom ou ruim.

### Caderno 2 — Comissões

5. **Comissões de que participa.** Fonte: `orgaosDeputados-L57`. Lista com titular/suplente, cargo (presidente, vice, relator-geral etc.) e período. Gráfico de linha do tempo.
6. **Presença nas reuniões das comissões em que é titular.** Fonte: eventos + órgãos realizadores + presença + `orgaosDeputados`. Denominador: reuniões realizadas dos órgãos em que ele era titular, na data da reunião. Documente quais tipos de evento entram (reunião deliberativa, audiência pública etc.) e por quê.
7. **Audiências públicas e eventos realizados a pedido do deputado.** Fonte: `eventosRequerimentos-{ano}` + `proposicoesAutores-{ano}`. Conta eventos realizados a partir de requerimentos de autoria dele. É a métrica mais próxima de "ouvir a sociedade" que os dados permitem.

### Caderno 3 — Projetos e leis

8. **Proposições apresentadas, por tipo.** Fonte: `proposicoes-{ano}` + `proposicoesAutores-{ano}`. Separe **autor principal (primeiro signatário)** de **coautoria**, porque o Regimento considera autores todos os que assinam (confira no arquivo como identificar o primeiro signatário). Tipos principais em destaque (PL, PLP, PEC, PDL), os demais agrupados. Gráfico de barras por tipo.
9. **O que aconteceu com os projetos dele.** Situação atual das proposições de autoria principal que podem virar norma (em tramitação, aprovadas, transformadas em norma jurídica, arquivadas, outras). Derive a **taxa de conversão** = transformadas em norma jurídica ÷ apresentadas. Limitação obrigatória: projetos levam anos, muitos são apensados a outros e aprovados "dentro" de outro projeto, e projetos recentes ainda não tiveram tempo.
10. **Temas dos projetos.** Fonte: `proposicoesTemas-{ano}` + lista de temas da API (`/referencias/proposicoes/codTema`). Distribuição por tema oficial da Câmara (gráfico). Se existir um tema oficial de homenagens/datas comemorativas, mostre a parcela dele **usando o nome oficial do tema**. Não crie classificação própria do tipo "projeto relevante" ou "estrutural": isso seria opinião.
11. **Pareceres como relator.** Confira se os pareceres de relator aparecem como proposições (siglas como PRL) com o relator como autor. Se sim, conte por ano e por comissão. Se não houver forma confiável de obter, registre no relatório e deixe de fora.

### Caderno 4 — Fiscalização do Executivo

12. **Requerimentos de informação (RIC)** de autoria dele: pedidos formais de explicação a ministérios.
13. **Propostas de fiscalização e controle (PFC).**
14. **Requerimentos de convocação de ministros e autoridades.** Só implemente se houver forma confiável de identificar (tipo/subtipo oficial). Se a única forma for buscar palavras na ementa, teste numa amostra, meça quantos acertos e erros, e só inclua se a precisão for alta; nesse caso, explique o método na metodologia. Caso contrário, deixe de fora e registre.
15. **Indicações (INC)**: sugestões formais ao Executivo. Mostre separado, como "sugestões ao governo", e não como fiscalização.

Gráfico: evolução por mês ou trimestre de RIC + PFC.

### Caderno 5 — Voz

16. **Discursos.** Fonte: API `/deputados/{id}/discursos` (confira se existe arquivo estático; se não, use a API com cache e meça o custo das ~513 consultas paginadas). Quantidade por ano e por fase da sessão. Se o custo diário ficar alto, atualize semanalmente e documente.

### Caderno 6 — Dinheiro público

17. **Cota parlamentar (CEAP).** Fonte: `https://www.camara.leg.br/cotas/Ano-{ano}.csv.zip` (atualização diária; não segue o padrão dos outros arquivos, leia o tutorial de campos da Câmara). Mostrar:
    - total gasto na legislatura e por ano;
    - por categoria (passagens, divulgação, combustível etc.), em gráfico de barras ou rosca;
    - por mês, em gráfico de colunas;
    - **% do teto do estado**: o teto mensal varia por estado e foi atualizado pelo Ato da Mesa nº 244/2026 (que corrige o Anexo Único do Ato da Mesa nº 43/2009). Encontre a tabela oficial de valores por estado e as datas de vigência; guarde num arquivo de configuração com o link da fonte. **Se não achar a tabela oficial, deixe `null` com TODO e mostre só os valores gastos.** Nunca use valores de notícia ou de memória.
    - Limitação obrigatória: o teto é por estado por causa do custo das passagens; gastar menos não significa trabalhar menos; reembolsos e glosas podem alterar valores depois.
18. **Equipe do gabinete.** Fonte: arquivo `funcionarios` (retrato do dia anterior, sem histórico). Mostrar quantos secretários parlamentares estão lotados no gabinete hoje (limite legal: 5 a 25). O gasto mensal com a equipe por gabinete **só** entra se você achar uma fonte oficial estruturada (CSV, JSON ou API). Se só existir em páginas HTML do portal de transparência, não faça scraping nesta fase: registre como fora do escopo e explique.
19. **Emendas parlamentares.** Fonte: Portal da Transparência da CGU. Prefira o download de dados em lote; se só houver API, ela exige uma chave gratuita: implemente com a chave lida de variável de ambiente (`PORTAL_TRANSPARENCIA_TOKEN`), deixe TODO para eu cadastrar e faça o pipeline funcionar sem ela (pulando só esta métrica, com aviso). Mostrar, por ano:
    - valores empenhados, liquidados e pagos (gráfico);
    - por tipo de emenda;
    - para emendas individuais, a divisão entre **transferências com finalidade definida** e **transferências especiais** (popularmente chamadas de "emendas Pix"; use o nome oficial e mencione o apelido só na explicação);
    - principais destinos (estados/municípios), em lista ou gráfico simples;
    - **execução** = pago ÷ empenhado. Limitação obrigatória: quem decide o ritmo de pagamento é o Poder Executivo, não o deputado; não apresente como "eficiência do gabinete".
    - **Ligação autor → deputado:** o autor vem como nome/código do sistema de orçamento, não com o id da Câmara. Faça a ligação por nome normalizado, com um arquivo de correspondências manuais para os casos ambíguos, e liste no relatório todos os autores que não conseguiu ligar. Nunca ligue por palpite.

### Caderno 7 — Articulação e perfil

20. **Frentes parlamentares** de que é membro. Fonte: `frentes` + `frentesDeputados`. Quantidade e lista.
21. **Cargos**: Mesa Diretora (`legislaturasMesas`), presidências e vice-presidências de comissões (`orgaosDeputados`) e liderança, se houver fonte oficial.
22. **Perfil**: profissões e ocupações declaradas (`deputadosProfissoes`, `deputadosOcupacoes`). Não é métrica; é contexto.

### O que fica de fora (e por quê)

Registre no relatório e na metodologia:

- **"Eficiência" da verba de gabinete:** não há dado estruturado por gabinete nos dados abertos (só se você encontrar, ver item 18).
- **"Relevância" ou "qualidade" dos projetos:** exigiria julgar o mérito, o que fere a neutralidade. Substituído pela distribuição por temas oficiais (item 10).
- **"Representar a sociedade e ouvir a base":** não existe dado oficial que meça isso diretamente; o mais próximo são as audiências públicas (item 7) e os discursos (item 16).
- Qualquer métrica da lista acima que, ao investigar, se mostre impossível ou cara de manter (critérios na seção 5).

## 3. Página do deputado

- Topo: identidade (foto em meio-tom, nome, partido, estado, situação) e um **"resumo em números"**: 4 a 6 números-manchete escolhidos entre os cadernos, sempre os mesmos para todos os deputados (não escolha por deputado, para não parecer destaque editorial).
- Depois, os cadernos, cada um com título de seção de jornal. Navegação rápida entre cadernos (âncoras), boa no celular.
- A página deve continuar leve. Se ficar pesada, divida o JSON por deputado e carregue só o necessário.
- Página `/glossario` com os termos (RIC, PFC, PEC, CEAP, emenda de bancada, transferência especial, orientação de bancada etc.) em linguagem simples, linkada a partir das fichas.

## 4. Gráficos

- **Sem custo e sem peso:** gere os gráficos no build, como SVG, sem biblioteca pesada no navegador. Pode ser SVG escrito à mão em componentes Astro ou uma biblioteca usada só no build; decida e registre num ADR.
- **Estilo infográfico de jornal**, coerente com a identidade: tinta sobre papel, o vermelho-tomate só para destacar o deputado ou o valor principal, rótulos diretos nas barras em vez de legendas distantes, números formatados em pt-BR (R$ 1,2 mi).
- **Acessíveis:** cada gráfico com título, descrição em texto e uma tabela com os mesmos dados (pode ficar recolhida).
- Funcionando no celular, sem rolagem horizontal, e na edição noturna.

## 5. Critérios para decidir se uma métrica é viável

Uma métrica entra se cumprir **todos**:

1. Vem de fonte oficial (Câmara, CGU ou outro órgão público), com dado estruturado (arquivo ou API), sem scraping de HTML.
2. Pode ser atualizada automaticamente pelo pipeline, no mínimo semanalmente.
3. O custo de mantê-la é zero ou quase zero (sem serviço pago; tempo de pipeline razoável no GitHub Actions; arquivos gerados que não façam o repositório crescer demais).
4. Pode ser calculada para todos os deputados com o mesmo método.
5. Pode ser explicada sem juízo de valor.

Se alguma falhar, deixe de fora, explique no relatório qual critério falhou e, se houver, o que mudaria isso no futuro.

**Atenção ao tamanho do repositório:** os dados gerados vão para o Git todo dia. Mantenha o JSON gerado compacto (só agregados, nunca dados brutos como cada despesa individual) e meça quanto o repositório cresce por execução. Se uma métrica fizer o Git crescer muito, proponha uma alternativa no relatório.

## 6. Design: um pouco menos sério

O site está bonito e **a estética de jornal antigo continua**. O objetivo é deixá-lo mais acolhedor e divertido para jovens, sem perder a limpeza. Você decide o que mudar; algumas direções possíveis, para escolher ou adaptar:

- Textos de apoio mais leves e diretos: caixas "Traduzindo:" ou "Em bom português:" ao lado dos termos técnicos.
- Elementos de jornal com humor gráfico: selos e carimbos levemente rotacionados, "recortes" de papel, setas e marcações à mão, pequenas ilustrações ou vinhetas de jornal antigo.
- Microinterações: hover e transições mais vivas, números que "sobem" ao aparecer (respeitando `prefers-reduced-motion`).
- Seções com nomes de jornal brincalhões (como "Classificados", "Plantão", "Errata"), desde que o conteúdo continue claro.
- Estados vazios e mensagens de erro simpáticos.

**Limites:** humor no design e nos textos de apoio, **nunca** sobre deputados, partidos ou posições políticas específicas; nada de caricatura de pessoas reais; os números e as explicações continuam sérios e precisos. Registre as escolhas em `docs/DESIGN.md`.

## 7. Critério de pronto da Fase 1

- `pnpm pipeline` gera todas as métricas viáveis para todos os deputados em exercício (com cache), e o tempo de execução fica registrado no relatório.
- Cada métrica tem função pura testada, validação Zod da fonte, seção na metodologia e exibição na ficha com gráfico (quando fizer sentido), "O que é isso?", "O que não mostra", fonte e data.
- `/glossario` publicado.
- `pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build` passam; `pnpm check:a11y` sem violações nas páginas novas; capturas de celular sem rolagem horizontal.
- Workflow diário atualizado para as novas fontes (e, se alguma for semanal, com a regra documentada).
- `docs/RELATORIO-FASE1.md` completo, incluindo a lista do que ficou de fora e por quê, o crescimento do repositório por execução e os TODOs que dependem de mim.

**Fora do escopo desta fase:** "monte seu ranking", comparações entre deputados, minigames, resumos com IA, deploy.
