// "O que é isso?" de cada métrica no "Monte seu ranking" (mesmas ideias das fichas, em uma ou
// duas frases). A ordem aqui é a ordem em que aparecem na escolha das métricas.

export const RANKING_METRIC_TEXT: Record<string, string> = {
  participacao:
    "Em quantas votações nominais do plenário votou, contando só os dias em que estava no cargo.",
  "presenca-sessoes":
    "Em quantas sessões deliberativas do plenário registrou presença, contando só os dias no cargo.",
  "alinhamento-partido":
    "Em quantas votações votou como o partido (ou a federação) orientou. Orientação só do bloco não entra.",
  "alinhamento-governo": "Em quantas votações votou como o Governo orientou.",
  "comissoes-titular-hoje": "Em quantas comissões é titular (com voto) hoje.",
  "presenca-comissoes": "Em quantas reuniões das comissões em que era titular registrou presença.",
  "eventos-requeridos":
    "Audiências públicas e outros eventos realizados a pedido do deputado, por requerimento aprovado.",
  "projetos-autor-principal":
    "Projetos (PL, PLP, PEC, PDL, PRC) apresentados como primeiro signatário nesta legislatura.",
  "projetos-viraram-norma":
    "Dos projetos apresentados como autor principal, quantos viraram norma jurídica.",
  "pareceres-relator":
    "Pareceres apresentados como relator de propostas nas comissões e no plenário.",
  ric: "Requerimentos de informação (pedidos formais de explicação a ministérios) como autor principal.",
  pfc: "Propostas de fiscalização e controle de atos do Poder Executivo como autor principal.",
  convocacoes:
    "Requerimentos de convocação de ministros e autoridades (presença obrigatória) como autor principal.",
  indicacoes: "Indicações: sugestões formais ao governo, que não é obrigado a seguir.",
  discursos: "Discursos registrados pela Câmara nas sessões do plenário nesta legislatura.",
  "cota-total":
    "Quanto da cota parlamentar (verba para despesas do mandato, reembolsada pela Câmara) foi gasto.",
  "cota-teto":
    "Gasto da cota em relação ao teto oficial do estado, só nos meses com tabela oficial do teto.",
  "equipe-secretarios":
    "Quantos secretários parlamentares estão no gabinete (de 5 a 25 pelas regras).",
  "emendas-empenhado":
    "Valor das emendas individuais ao Orçamento empenhado (reservado) pelo governo, orçamentos de 2024 em diante.",
  "emendas-execucao":
    "Quanto do valor empenhado das emendas já foi pago. Quem decide o ritmo de pagamento é o governo.",
  frentes: "Em quantas frentes parlamentares (grupos sobre um tema) é membro.",
};
