// Imagens de prévia (Open Graph) do Extrapolar: o que aparece ao compartilhar um link no
// WhatsApp e nas redes. Identidade de jornal (papel, tinta, Fraunces, vermelho-tomate).
// Regra: nenhuma métrica nem número de deputado na imagem, para nada circular fora de contexto.
// Elementos para o satori: todo <div> com mais de um filho precisa de display: flex.
import type { CSSProperties, ReactNode } from "react";

export const OG_COLORS = {
  paper: "#f4efe3",
  card: "#ece5d4",
  ink: "#1b1a17",
  inkSoft: "#57524a",
  rule: "#8c8473",
  accent: "#e4432a",
  accentInk: "#b5321c",
  marker: "#ffb8a6",
} as const;

const C = OG_COLORS;

export interface StaticCard {
  /** Caminho da imagem sem extensão, em /og/ (ex.: "jogos/dle"). */
  slug: string;
  kicker: string;
  title: string;
  subtitle: string;
  stamp: string;
  alt: string;
}

export const DEFAULT_CARD_SLUG = "extrapolar";

export const STATIC_CARDS: StaticCard[] = [
  {
    slug: DEFAULT_CARD_SLUG,
    kicker: "Câmara dos Deputados",
    title: "O que os deputados federais estão fazendo na Câmara",
    subtitle: "Números e fatos, com fonte oficial e sem julgamento.",
    stamp: "Dado oficial",
    alt: "Extrapolar: o que os deputados federais estão fazendo na Câmara. Números e fatos, com fonte oficial e sem julgamento.",
  },
  {
    slug: "jogos",
    kicker: "Jogos",
    title: "Jogos com votações reais da Câmara",
    subtitle:
      "Adivinhe o deputado do seu estado, chute o placar, vote você também e seja deputado.",
    stamp: "Edição extra",
    alt: "Extrapolar, Jogos: jogos com votações reais da Câmara.",
  },
  {
    slug: "jogos/dle",
    kicker: "Jogo diário",
    title: "Dle do seu estado",
    subtitle: "Adivinhe o deputado do dia entre os que representam o seu estado.",
    stamp: "Adivinhe",
    alt: "Extrapolar, jogo Dle do seu estado: adivinhe o deputado do dia entre os que representam o seu estado.",
  },
  {
    slug: "jogos/placar",
    kicker: "Jogo diário",
    title: "Placar",
    subtitle: "Leia o que foi votado no plenário e chute como votou a Câmara.",
    stamp: "Chute o placar",
    alt: "Extrapolar, jogo Placar: leia o que foi votado no plenário e chute como votou a Câmara.",
  },
  {
    slug: "jogos/vote-voce-tambem",
    kicker: "Rodada da semana",
    title: "Vote você também",
    subtitle: "Vote em 10 votações recentes do plenário e veja com quem votou igual.",
    stamp: "Seu voto",
    alt: "Extrapolar, jogo Vote você também: vote em 10 votações recentes do plenário e veja com quem votou igual.",
  },
  {
    slug: "jogos/seja-deputado",
    kicker: "A cadeira é sua",
    title: "Seja deputado",
    subtitle: "Vote na votação mais recente do plenário e confira o resultado oficial.",
    stamp: "Em plenário",
    alt: "Extrapolar, jogo Seja deputado: vote na votação mais recente do plenário e confira o resultado oficial.",
  },
  {
    slug: "ranking",
    kicker: "Monte seu ranking",
    title: "Você escolhe os critérios",
    subtitle:
      "Métricas, pesos e direção escolhidos por você. O Extrapolar não define ranking oficial.",
    stamp: "Seus critérios",
    alt: "Extrapolar, Monte seu ranking: você escolhe as métricas, os pesos e a direção. O Extrapolar não define ranking oficial.",
  },
];

export interface DeputyCardData {
  name: string;
  party: string;
  state: string;
  stateName: string;
  /** SVG do meio-tom em data URI; null quando a foto não baixou. */
  photo: string | null;
}

export const DEPUTY_CALL = "Veja o que fez na Câmara";

export function deputyAlt(d: Pick<DeputyCardData, "name" | "party" | "state" | "stateName">) {
  return `Extrapolar: foto em meio-tom de ${d.name} (${d.party}-${d.state}, ${d.stateName}) e a frase "${DEPUTY_CALL}".`;
}

const kicker: CSSProperties = {
  fontFamily: "Newsreader",
  fontWeight: 500,
  fontSize: 22,
  letterSpacing: 3,
  textTransform: "uppercase",
};

function Frame({
  children,
  credit,
  host,
}: {
  children: ReactNode;
  credit: string;
  host: string | null;
}) {
  return (
    // O satori soma o padding ao tamanho da caixa; as margens ficam num quadro interno absoluto.
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        backgroundColor: C.paper,
        color: C.ink,
        fontFamily: "Newsreader",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 34,
          right: 56,
          bottom: 30,
          left: 56,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              fontFamily: "Fraunces",
              fontWeight: 900,
              fontSize: 50,
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            Extrapolar
          </div>
          <div style={{ ...kicker, fontSize: 18, color: C.inkSoft, paddingBottom: 4 }}>
            Câmara dos Deputados em números
          </div>
        </div>
        {/* Régua dupla do masthead */}
        <div
          style={{
            display: "flex",
            marginTop: 14,
            height: 7,
            borderTop: `2px solid ${C.ink}`,
            borderBottom: `2px solid ${C.ink}`,
          }}
        />
        <div style={{ display: "flex", flex: 1, position: "relative", marginTop: 30 }}>
          {children}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${C.rule}`,
            paddingTop: 12,
            fontSize: 20,
            fontStyle: "italic",
            color: C.inkSoft,
          }}
        >
          <div>{credit}</div>
          <div style={{ fontStyle: "normal", fontWeight: 500, color: C.ink }}>{host ?? ""}</div>
        </div>
      </div>
    </div>
  );
}

function Stamp({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        border: `4px solid ${C.accent}`,
        borderRadius: 6,
        color: C.accent,
        fontFamily: "Fraunces",
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: 3,
        textTransform: "uppercase",
        padding: "6px 16px",
        transform: "rotate(-6deg)",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

/** Tamanho da manchete conforme o comprimento, para caber em até três linhas. */
function headlineSize(text: string, sizes: [number, number][]): number {
  for (const [maxLength, size] of sizes) if (text.length <= maxLength) return size;
  return sizes[sizes.length - 1]?.[1] ?? 56;
}

export function StaticCardImage({ card, host }: { card: StaticCard; host: string | null }) {
  const size = headlineSize(card.title, [
    [12, 120],
    [20, 100],
    [36, 82],
    [60, 70],
  ]);
  return (
    <Frame credit="Dados abertos da Câmara dos Deputados" host={host}>
      <div style={{ display: "flex", flexDirection: "column", width: 900 }}>
        <div style={{ ...kicker, color: C.accentInk }}>{card.kicker}</div>
        <div
          style={{
            fontFamily: "Fraunces",
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1.02,
            letterSpacing: -1.5,
            marginTop: 14,
          }}
        >
          {card.title}
        </div>
        {/* Traço de caneta sob a manchete */}
        <div
          style={{
            display: "flex",
            width: 200,
            height: 9,
            marginTop: 20,
            backgroundColor: C.accent,
            borderRadius: 6,
            transform: "rotate(-1.2deg)",
          }}
        />
        <div
          style={{
            fontSize: 34,
            fontStyle: "italic",
            color: C.inkSoft,
            marginTop: 20,
            lineHeight: 1.25,
          }}
        >
          {card.subtitle}
        </div>
      </div>
      <Stamp text={card.stamp} style={{ right: 10, bottom: 34 }} />
    </Frame>
  );
}

export function DeputyCardImage({ deputy, host }: { deputy: DeputyCardData; host: string | null }) {
  const size = headlineSize(deputy.name, [
    [14, 92],
    [20, 80],
    [26, 68],
    [34, 58],
  ]);
  const badge: CSSProperties = {
    display: "flex",
    border: `2px solid ${C.ink}`,
    borderRadius: 999,
    padding: "4px 18px",
    fontFamily: "Newsreader",
    fontWeight: 500,
    fontSize: 26,
    letterSpacing: 2,
  };
  return (
    <Frame credit="Foto: Câmara dos Deputados · dados abertos da Câmara" host={host}>
      <div style={{ display: "flex", width: "100%", alignItems: "stretch" }}>
        <div
          style={{
            display: "flex",
            width: 300,
            height: 400,
            flexShrink: 0,
            border: `2px solid ${C.ink}`,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: C.card,
          }}
        >
          {deputy.photo ? <img src={deputy.photo} width={300} height={400} alt="" /> : null}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginLeft: 48,
            flex: 1,
            paddingBottom: 20,
          }}
        >
          <div style={{ ...kicker, color: C.accentInk }}>Ficha na Câmara dos Deputados</div>
          <div
            style={{
              fontFamily: "Fraunces",
              fontWeight: 800,
              fontSize: size,
              lineHeight: 1.02,
              letterSpacing: -1.5,
              marginTop: 14,
            }}
          >
            {deputy.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 22 }}>
            <div style={badge}>{deputy.party}</div>
            <div style={{ ...badge, marginLeft: 12 }}>{deputy.state}</div>
            <div style={{ fontSize: 30, fontStyle: "italic", color: C.inkSoft, marginLeft: 18 }}>
              {deputy.stateName}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 34 }}>
            <div
              style={{
                display: "flex",
                backgroundColor: C.marker,
                padding: "6px 16px",
                fontSize: 36,
                fontWeight: 500,
                transform: "rotate(-1deg)",
              }}
            >
              {DEPUTY_CALL}
            </div>
          </div>
          <div style={{ fontSize: 26, fontStyle: "italic", color: C.inkSoft, marginTop: 16 }}>
            Com fonte oficial e sem julgamento.
          </div>
        </div>
      </div>
    </Frame>
  );
}
