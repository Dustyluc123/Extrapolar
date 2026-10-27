import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { DEPUTY_CALL, DeputyCardImage, STATIC_CARDS, deputyAlt } from "../src/lib/og/cards";
import { dotRadius, halftoneSvg } from "../src/lib/og/halftone";
import { renderPng } from "../src/lib/og/render";
import { LOCAL_SITE_URL, absoluteUrl, displayHost, resolveSiteUrl } from "../src/lib/site";

describe("endereço do site nas meta tags", () => {
  it("usa SITE_URL, depois o domínio de produção da Vercel, depois localhost", () => {
    expect(resolveSiteUrl({ SITE_URL: "https://extrapolar.com.br/" })).toBe(
      "https://extrapolar.com.br",
    );
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "extrapolar.vercel.app" })).toBe(
      "https://extrapolar.vercel.app",
    );
    expect(resolveSiteUrl({})).toBe(LOCAL_SITE_URL);
  });

  it("monta URLs absolutas e esconde localhost na imagem", () => {
    expect(absoluteUrl("/og/jogos/dle.png", "https://extrapolar.com.br")).toBe(
      "https://extrapolar.com.br/og/jogos/dle.png",
    );
    expect(displayHost("https://extrapolar.com.br")).toBe("extrapolar.com.br");
    expect(displayHost(LOCAL_SITE_URL)).toBeNull();
  });
});

describe("meio-tom", () => {
  it("ponto cresce com o escuro e some no branco", () => {
    expect(dotRadius(255, 6)).toBe(0);
    expect(dotRadius(128, 6)).toBeGreaterThan(0);
    expect(dotRadius(0, 6)).toBeGreaterThan(dotRadius(128, 6));
    // Nunca passa de metade da diagonal da célula.
    expect(dotRadius(0, 6, 2)).toBeLessThanOrEqual(6 * 0.71);
  });

  it("gera um ponto por célula não branca", () => {
    const svg = halftoneSvg(
      { pixels: new Uint8Array([0, 255, 128, 255]), cols: 2, rows: 2 },
      { cell: 10, ink: "#000", paper: "#fff" },
    );
    expect(svg).toContain('width="20" height="20"');
    expect(svg.match(/<circle/g)).toHaveLength(2);
  });

  it("recusa tamanho errado", () => {
    expect(() =>
      halftoneSvg({ pixels: new Uint8Array(3), cols: 2, rows: 2 }, { cell: 1, ink: "", paper: "" }),
    ).toThrow(/pixels/);
  });
});

describe("textos das imagens de prévia", () => {
  it("não trazem números de métricas nem gênero inventado na chamada da ficha", () => {
    expect(DEPUTY_CALL).not.toMatch(/\d|deputad[oa]\b/i);
    expect(deputyAlt({ name: "Fulana", party: "XX", state: "AP", stateName: "Amapá" })).toContain(
      "Fulana (XX-AP, Amapá)",
    );
  });

  it("toda imagem fixa tem texto alternativo e caminho único", () => {
    const slugs = STATIC_CARDS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const card of STATIC_CARDS) expect(card.alt.length).toBeGreaterThan(20);
  });
});

describe("geração do PNG", () => {
  it("ficha sem foto sai em 1200 × 630", async () => {
    const png = await renderPng(
      <DeputyCardImage
        deputy={{
          name: "Nome de Teste",
          party: "XX",
          state: "AP",
          stateName: "Amapá",
          photo: null,
        }}
        host={null}
      />,
    );
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe("png");
    expect([meta.width, meta.height]).toEqual([1200, 630]);
  }, 20_000);
});
