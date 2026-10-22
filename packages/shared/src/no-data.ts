// Motivos padronizados de "sem dado". Todo valor que não puder ser calculado aparece na ficha
// como "sem dado" com um destes motivos — nunca como zero (CLAUDE.md, princípio 3).

export const NO_DATA_REASONS = {
  "sem-votacao-elegivel": "Não houve votação nominal no plenário enquanto estava em exercício.",
  "sem-sessao-elegivel": "Não houve sessão deliberativa do plenário enquanto estava em exercício.",
  "sem-orientacao-elegivel":
    "Não houve votação em que tenha votado e o partido (ou a federação) tenha orientado; orientação só do bloco não entra.",
  "sem-orientacao-do-governo":
    "Não houve votação em que tenha votado e o Governo tenha orientado (fora 'Liberado').",
  "nao-e-titular-de-comissao": "Não foi titular de nenhuma comissão enquanto estava em exercício.",
  "sem-reuniao-elegivel": "As comissões em que foi titular não fizeram reunião no período.",
  "sem-proposicao-elegivel":
    "Não apresentou, como autor principal, proposição que possa virar norma.",
  "sem-teto-oficial": "Não encontramos a tabela oficial do teto da cota para este período.",
  "sem-gasto-no-periodo": "Não há despesa registrada na cota no período em exercício.",
  "sem-equipe-no-arquivo":
    "O arquivo de funcionários da Câmara (retrato do dia anterior) não traz secretários lotados neste gabinete; pode ser posse recente.",
  "sem-emenda-empenhada":
    "Não há emenda individual empenhada deste autor nos orçamentos de 2024 em diante.",
  "fonte-indisponivel": "A fonte oficial não estava disponível na última atualização.",
  "autor-nao-identificado":
    "Não encontramos, na base da CGU, um autor de emendas com o mesmo nome deste deputado (por exemplo, por posse recente, licença ou grafia diferente). Não ligamos por palpite.",
} as const;

export type NoDataReason = keyof typeof NO_DATA_REASONS;
export const NO_DATA_REASON_CODES = Object.keys(NO_DATA_REASONS) as [
  NoDataReason,
  ...NoDataReason[],
];
