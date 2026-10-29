import { describe, expect, it } from "vitest";
import { isMobileDevice, placarShareText, shareLinks } from "../src/index";

const text = placarShareText({
  number: 7,
  stateCorrect: true,
  scorePoints: 80,
  url: "https://extrapolar.com.br/jogos/placar",
});

describe("shareLinks", () => {
  it("monta o link do WhatsApp com o texto inteiro, codificado", () => {
    const links = shareLinks(text);
    expect(links.whatsappApp.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(links.whatsappApp.split("text=")[1]!)).toBe(text);
    expect(decodeURIComponent(links.whatsappWeb.split("text=")[1]!)).toBe(text);
    expect(links.whatsappWeb.startsWith("https://web.whatsapp.com/send?text=")).toBe(true);
  });

  it("monta o mailto com assunto na primeira linha e corpo com CRLF", () => {
    const { email } = shareLinks(text);
    const params = new URLSearchParams(email.slice("mailto:?".length));
    expect(params.get("subject")).toBe("Extrapolar · Placar #7");
    expect(params.get("body")).toBe(text.replace(/\n/g, "\r\n"));
    // Espaço vira %20, nunca "+", para os clientes de e-mail não mostrarem o sinal.
    expect(email).not.toContain("+");
  });

  it("não acrescenta parâmetros de rastreamento", () => {
    const links = shareLinks(text);
    for (const url of Object.values(links)) {
      expect(url).not.toMatch(/utm_|ref=|fbclid|gclid/);
    }
  });

  it("codifica emojis e o caractere &", () => {
    const { whatsappApp } = shareLinks("A & B 🟩");
    expect(whatsappApp).toBe("https://wa.me/?text=A%20%26%20B%20%F0%9F%9F%A9");
  });
});

describe("isMobileDevice", () => {
  it("reconhece celulares", () => {
    expect(isMobileDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari")).toBe(true);
    expect(isMobileDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
  });

  it("trata o iPad que se apresenta como Mac pela tela de toque", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";
    expect(isMobileDevice(ua, 5)).toBe(true);
    expect(isMobileDevice(ua, 0)).toBe(false);
  });

  it("computador comum não é celular", () => {
    expect(isMobileDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0")).toBe(false);
  });
});
