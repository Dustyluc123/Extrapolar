# Relatório da noite — Fase 0 (etapas 2 a 9)

Noite de 21 para 22 de outubro de 2026. Rodei as etapas 2 a 9 do plano aprovado sem parar, com um commit por etapa. Nada foi enviado ao GitHub (sem `git push`).

## Resumo

**A Fase 0 está pronta localmente.** `pnpm install && pnpm dev` sobe o site com dados reais da Câmara: 513 deputados em exercício, 1.128 votações nominais de plenário e 456.837 votos individuais (dados de 22/10/2026). Testes, lint, tipos, formatação, build, neutralidade e acessibilidade passam.

O que ainda depende de você: configurar a Vercel e o GitHub (o CI e o workflow diário nunca rodaram de verdade, porque não houve push) e conferir algumas condições de uso. A lista completa está em [TODOs que dependem de você](#todos-que-dependem-de-você).

Quatro decisões de metodologia que tomei sozinho merecem seu olhar primeiro: **voto secreto conta como participação** (ADR 0008), **eventos do histórico anteriores à legislatura são ignorados** (ADR 0009), **voto fora do período em exercício entra na conta** (ADR 0007) e **a ficha não mostra comparação com a média** (ADR 0010).

| Commit    | Etapa                                                               |
| --------- | ------------------------------------------------------------------- |
| `021d124` | 1 — Estrutura do monorepo (feita antes da noite, com sua aprovação) |
| `ac2edb6` | 2 — CLAUDE.md, documentação inicial e CI                            |
| `2a6cb75` | 3 — Legislatura configurável e esquemas Zod                         |
| `6511446` | 4 — Pipeline de deputados em exercício                              |
| `f3b888d` | 5 — Participação em votações nominais de plenário                   |
| `2bbebde` | 6 — Identidade visual de jornal e layout base                       |
| `a0b258a` | 7 — Capa com busca e ficha do deputado                              |
| `785e244` | 8 — Metodologia, "Sobre" e atualização diária dos dados             |
| `48f483f` | 9 — Revisão final: neutralidade, acessibilidade, licença e README   |
| (último)  | Este relatório e os ADRs 0010 e 0011                                |

## O que foi feito em cada etapa

### Etapa 2 — CLAUDE.md, docs e CI

- Antes de escrever, **conferi os dados reais da Câmara** (API e arquivos estáticos) para a documentação descrever o formato verdadeiro e não o da minha memória. Foi aí que apareceram detalhes importantes: no arquivo de votos o id do deputado vem como texto; o histórico usa grafias diferentes da tabela oficial (`CONVOCADO`, `SUPLENCIA`); "Artigo 17" é registrado para quem preside a sessão.
- `CLAUDE.md` com os princípios, a convenção de idioma (código em inglês, todo o resto em pt-BR, campos da Câmara com o nome original nos esquemas de entrada), os comandos e a arquitetura.
- `docs/ARQUITETURA.md`, `METODOLOGIA.md`, `DESIGN.md` (com contraste calculado de cada cor), `FONTES.md` (com o formato conferido de cada fonte) e ADRs 0001 a 0007.
- `.github/workflows/ci.yml`: formatação, lint, tipos, testes e build a cada push.

### Etapa 3 — `packages/shared`

- `legislature.ts`: 57ª e 58ª legislaturas com datas **conferidas na API** (`/legislaturas/57` e `/58`). Trocar de legislatura = mudar `CURRENT_LEGISLATURE_ID`.
- Esquemas Zod de entrada (formato da Câmara) e de saída (os JSON gerados), com `parseOrThrow`, que aponta o campo exato do problema (ex.: `dados[12].siglaUf`).
- Interface `DeputyRepository` para o site.
- 16 testes, com amostras reais da Câmara e versões alteradas (campo faltando, tipo trocado, tipo de voto desconhecido, data em outro formato).

### Etapa 4 — Pipeline de deputados

- Cliente HTTP com no máximo 2 requisições simultâneas, 250 ms entre o início de cada uma e até 5 novas tentativas com espera crescente (1 s, 2 s, 4 s…) em erro de rede, 429 e 5xx.
- Cache em `data/raw/`: vale 20 horas; depois disso, os arquivos estáticos são conferidos com `HEAD` (se o `Last-Modified` não mudou, reaproveita). `pnpm pipeline -- --refresh` ignora o cache.
- Períodos em exercício montados a partir do histórico oficial de cada deputado.
- Publicação atômica: valida toda a saída antes e só grava se tudo estiver certo.
- Primeira execução completa: 2 min 13 s (513 históricos pela API). Com cache: 2 s.

### Etapa 5 — Participação

- Função pura em `packages/metrics` com 13 testes.
- O pipeline lê os arquivos de votações e votos de 2023 a 2026, um ano por vez, para não ter os quatro arquivos brutos na memória ao mesmo tempo.
- **Conferência:** nas 1.128 votações nominais de plenário, o número de votos individuais no arquivo é igual ao total oficial (sim + não + outros) de cada votação.
- **Dois problemas reais encontrados e tratados** (detalhes nas decisões abaixo):
  1. Os arquivos de 2025 e 2026 trouxeram um tipo de voto novo, vazio (`""`). O pipeline parou, como devia. Eram votações secretas.
  2. Um suplente aparecia com 1,3% de participação porque o histórico dele tinha um evento de 2022 marcado como 57ª legislatura. O valor certo é 88,2% (15 de 17).
- Avisos de qualidade registrados no `meta.json`: 8 eventos antes da legislatura (ignorados) e 17 votos fora do período em exercício (contados).

### Etapa 6 — Identidade visual

- Tailwind 4 com tokens de papel e tinta, vermelho-tomate como marca-texto, Fraunces (manchetes) e Newsreader (texto) servidas pelo próprio site (licença SIL OFL).
- Cabeçalho de jornal com "Edição de quinta-feira, 22 de outubro de 2026", réguas, textura leve de papel e fotos em meio-tom feito só em CSS.
- Edição noturna pelo sistema ou pelo botão, gravada no navegador, sem piscar ao carregar.
- O marca-texto da edição noturna estava ilegível (texto claro sobre salmão claro); troquei por `#9A3A28` (5,7:1 de contraste).

### Etapa 7 — Capa e ficha

- Capa com os 513 deputados em ordem alfabética, busca sem acento e filtros por estado e partido, com o filtro na URL (`/?uf=SP&partido=PT&q=maria`). Sem JavaScript, a lista completa continua visível.
- Ficha `/deputados/[id]`: dados básicos, participação como número-manchete, tabela por tipo de voto, barra "com voto / sem voto", "O que este número não mostra", períodos em exercício, fonte, data e link para a metodologia.
- Tamanho (comprimido): capa 33 KB, ficha 4 KB. O Zod não vai para o navegador.

### Etapa 8 — Metodologia, "Sobre" e pipeline agendado

- `/metodologia` é gerada direto de `docs/METODOLOGIA.md`; um texto só para o site e para a documentação.
- `/sobre` com os princípios.
- `.github/workflows/pipeline.yml`: todo dia às 06:00 de Brasília, roda o pipeline, testa e builda o site com os dados novos e só então commita `data/generated`. Também dá para rodar à mão, com opções para baixar tudo de novo e forçar o deploy hook.
- `docs/DEPLOY.md` com o passo a passo da Vercel e do GitHub.

### Etapa 9 — Revisão final

- Neutralidade: `pnpm check:neutralidade`, como você pediu (só `apps/web`, só aviso, com lista de exceções). Achou dois casos legítimos em comentários de código, que viraram as primeiras exceções.
- Acessibilidade: `pnpm check:a11y` com axe-core nos temas claro e escuro. Achou e corrigi dois problemas (nome do link do cabeçalho e um bloco de código rolável sem acesso pelo teclado). Agora: zero violações e a busca funciona pelo teclado.
- Celular: `pnpm screenshots` não acusou rolagem horizontal em nenhuma página, depois de eu corrigir uma na metodologia.
- `LICENSE` (MIT, mesmo texto do Chutaí) e `README.md` no estilo do Chutaí.

## Decisões que tomei sozinho

Todas registradas em `docs/decisoes/`. As marcadas com ⚠ mudam números ou o que o leitor vê; vale revisar primeiro.

1. ⚠ **Voto secreto conta como participação** (ADR 0008). Voto vazio só é aceito em votação marcada como secreta; fora disso, o pipeline para. Afeta 2 votações.
2. ⚠ **Eventos do histórico datados antes da legislatura são ignorados** (ADR 0009). Corrigiu um caso real (de 1,3% para 88,2%).
3. ⚠ **Voto fora do período em exercício entra na conta** (ADR 0007): se a pessoa votou, estava em exercício. Afeta 17 votos de 6 deputados, geralmente minutos de diferença entre posse e votação.
4. ⚠ **A ficha não compara com a média da Câmara** (ADR 0010), para não convidar a ranking. Mostra o aviso "poucas votações" abaixo de 30.
5. **Empate de horário no histórico:** o evento que fecha o período vem antes do que abre (ADR 0007).
6. **Votação sem horário de registro** usa o horário do primeiro voto (não aconteceu em nenhuma nominal de plenário até agora).
7. **Condição eleitoral "EFETIVADO"** aparece como "Suplente efetivado".
8. **Rótulo sem gênero** na ficha: "Câmara dos Deputados · Bahia" em vez de "Deputado federal" (ADR 0010).
9. **Um commit de dados por dia** (ADR 0004 atualizado): a data da edição muda todo dia, então o `meta.json` sempre muda. É mais simples e combina com a ideia de edição diária.
10. **Data da edição** = data e hora em que o pipeline rodou (horário de Brasília). A data da última votação aparece na capa.
11. **Verificações automáticas** (ADR 0011): neutralidade em JavaScript puro (`.mjs` em vez do `.ts` do plano, para não precisar de tsx na raiz); acessibilidade e capturas usam o Chrome da máquina e por isso ficam fora do CI.
12. **Capturas fora do Git** (`docs/screenshots/`); as imagens do README ficam em `docs/imagens/`, em JPEG reduzido.
13. **Domínio do site não definido:** `astro.config.mjs` lê `SITE_URL`; não inventei endereço.
14. **README:** escrevi o texto da seção "Sobre mim" e a ordem das fases do roadmap a partir da visão do briefing. **Revise as duas** antes de publicar, porque falam por você.
15. **Antes da noite** (já combinados): Astro 6 em vez de 7 e TypeScript 5.9 em vez de 7 (ADR 0006).

## Algo que fiz errado

- Na etapa 5, para ver o arquivo de votos de 2026, baixei uma cópia temporária em `/tmp/vv2026.json`, **fora da pasta do projeto**, contra a sua regra. Percebi na hora e apaguei o arquivo (confirmado). Fora isso, só escrevi fora do projeto por efeito colateral de ferramentas: o armazenamento global do pnpm (pacotes instalados com `pnpm install`), a memória do próprio Claude Code e as pastas temporárias que os testes do cache e da publicação criam e apagam.
- O cache `data/raw/` ocupa cerca de 330 MB dentro do projeto (fora do Git). Pode apagar quando quiser; o pipeline baixa de novo.

## TODOs que dependem de você

**Para colocar no ar**

- [ ] **Vercel:** importar o repositório com Root Directory `apps/web`, Node 22 (passo a passo em `docs/DEPLOY.md`).
- [ ] **Domínio:** definir `SITE_URL` na Vercel (`apps/web/astro.config.mjs`).
- [ ] **GitHub Actions:** dar permissão de escrita ao workflow (Settings → Actions → General → Workflow permissions) e conferir se a proteção do `main` deixa o bot commitar.
- [ ] **Deploy hook (opcional):** criar na Vercel e salvar como secret `VERCEL_DEPLOY_HOOK_URL`.
- [ ] **Fazer o push** e conferir o primeiro CI e um disparo manual do workflow "Atualização dos dados".

**Para conferir em fonte oficial** (não preenchi nada de memória)

- [ ] **Licença dos dados abertos:** só achei o FAQ dizendo que não há restrição de uso; não achei uma licença formal (`docs/FONTES.md`).
- [ ] **Uso das fotos oficiais:** não achei as condições de uso; o site dá o crédito "Foto: Câmara dos Deputados" (`docs/FONTES.md`).
- [ ] **"Artigo 17":** conferir no Regimento Interno o dispositivo que fundamenta o registro; a descrição atual vem só do que os dados mostram (`docs/FONTES.md`).

**Para decidir**

- [ ] Revisar os ADRs 0008, 0009, 0010 e 0011 e as decisões ⚠ acima.
- [ ] **Canal de contato** na página "Sobre" (TODO em `apps/web/src/pages/sobre.astro`).
- [ ] Revisar "Sobre mim" e o roadmap no README.
- [ ] Decidir se a varredura de neutralidade deve olhar também `docs/METODOLOGIA.md`, que aparece no site (hoje não olha, porque você pediu só `apps/web`).

**Nenhum valor ficou `null` por falta de fonte nesta fase.** A métrica da Fase 0 não precisou de números de fora da Câmara; o caso clássico (teto da cota por estado) só aparece na fase de gastos.

## O que não deu para verificar

- **CI e workflow diário nunca rodaram no GitHub** (sem push). Validei a sintaxe dos YAML e rodei localmente cada comando que eles executam.
- **Deploy na Vercel** não foi testado.
- **"Sem dado" na ficha:** hoje todos os 513 deputados têm votações elegíveis, então esse caminho só foi coberto pelos testes da métrica, não visto numa página real.
- **Fotos na capa:** carregam sob demanda, então as capturas automáticas da capa mostram os quadros vazios; nas fichas aparecem normalmente.

## Como testar tudo

```bash
cd ~/Downloads/Extrapolar
pnpm install

# Qualidade (o mesmo que o CI roda)
pnpm format:check && pnpm lint && pnpm check:neutralidade && pnpm typecheck && pnpm test && pnpm build

# Site com os dados já gerados
pnpm dev                       # http://localhost:4321

# Pipeline
pnpm pipeline                  # com cache: segundos
pnpm pipeline -- --refresh     # baixa tudo de novo: ~2 a 3 minutos, ~300 MB

# Acessibilidade e capturas (precisam do build rodando e do Google Chrome)
pnpm build && pnpm --filter @extrapolar/web preview    # deixe rodando em outro terminal
pnpm check:a11y
pnpm screenshots / /deputados/178882 /deputados/74140 /metodologia /sobre   # imagens em docs/screenshots/
```

**O que olhar no navegador**

- Capa: busca "acacio" (sem acento), filtro por estado e partido, o endereço muda e o botão "Limpar" volta tudo.
- `/deputados/178882` (licenciado várias vezes para ser ministro): seis períodos em exercício, 98 de 201 votações.
- `/deputados/74140` (o suplente corrigido pelo ADR 0009): 15 de 17 votações, com o aviso de poucas votações.
- Uma ficha de quem presidiu sessões (ex.: Hugo Motta): muitos "Artigo 17" na tabela.
- Botão "Edição noturna" no topo; recarregue a página e veja que a escolha continua.
- `/metodologia#participacao` abre direto na seção.
- No celular (ou com o DevTools em 390 px): nada passa da largura da tela.
