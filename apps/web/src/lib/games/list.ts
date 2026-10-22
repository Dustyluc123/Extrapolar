// Os quatro jogos: nome, chamada e "Como jogar" (usados em /jogos e na página de cada jogo).
// `ready` vira true quando o jogo entra no ar.

export interface GameInfo {
  slug: string;
  title: string;
  kicker: string;
  /** Uma frase de chamada. */
  pitch: string;
  /** "Como jogar", em poucos passos. */
  howTo: string[];
  /** Diário, semanal ou "a cada atualização". */
  rhythm: string;
  ready: boolean;
}

export const GAMES: GameInfo[] = [
  {
    slug: "dle",
    title: "Dle do seu estado",
    kicker: "Jogo 1 · Adivinhe",
    pitch: "Descubra o deputado do dia entre os que representam o seu estado.",
    rhythm: "Um deputado novo por dia, para cada estado",
    howTo: [
      "Escolha o seu estado e chute um deputado da bancada.",
      "Cada característica volta colorida: verde é igual, amarelo é perto ou tem algo em comum, vermelho é diferente.",
      "Setas dizem se o número do deputado do dia é maior ou menor.",
      "Acertou? A ficha completa está a um clique.",
    ],
    ready: true,
  },
  {
    slug: "placar",
    title: "Placar",
    kicker: "Jogo 2 · Palpite",
    pitch: "Leia o que foi votado e chute como a Câmara votou.",
    rhythm: "Uma votação por dia",
    howTo: [
      "Leia o resumo oficial de uma votação real do plenário.",
      "Responda como votou a maioria dos deputados do seu estado.",
      "Arraste o controle até a porcentagem de votos Sim que você acha que deu.",
      "Quanto mais perto do placar real, mais pontos.",
    ],
    ready: true,
  },
  {
    slug: "vote-voce-tambem",
    title: "Vote você também",
    kicker: "Jogo 3 · Sua vez",
    pitch: "Vote em 10 votações reais e veja com quem você coincidiu.",
    rhythm: "Uma rodada nova por semana, às segundas",
    howTo: [
      "Vote Sim ou Não em 10 votações recentes do plenário (ou pule).",
      "No fim, veja com quais deputados você votou igual mais vezes.",
      "É só uma conta de votos iguais, não uma recomendação: cada votação é uma de muitas.",
    ],
    ready: true,
  },
  {
    slug: "seja-deputado",
    title: "Seja deputado",
    kicker: "Jogo 4 · Notícia do dia",
    pitch: "A votação mais recente da Câmara: vote e confira quem votou o quê.",
    rhythm: "Muda quando há votação nova",
    howTo: [
      "Leia o resumo da votação mais recente que o site tem.",
      "Vote Sim ou Não.",
      "Veja o resultado, o placar e o voto de cada deputado, com filtro por estado e partido.",
    ],
    ready: true,
  },
];

export const PRIVACY_NOTE = "Suas respostas ficam só neste aparelho. Nada é enviado.";

export const NEUTRALITY_NOTE =
  "Os jogos testam o que aconteceu, nunca opinião: nenhum voto é tratado como certo ou errado.";
