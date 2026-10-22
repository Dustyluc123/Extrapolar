import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatBRLCompact,
  formatDateTime,
  formatEditionDate,
  formatInteger,
  formatLongDate,
  formatPercent,
  formatShortDate,
  plural,
} from "../src/lib/format";

describe("datas", () => {
  it("formata a edição do jornal com o dia da semana", () => {
    expect(formatEditionDate("2026-10-21T23:59:00")).toBe(
      "Edição de quarta-feira, 21 de outubro de 2026",
    );
  });

  it("não desloca o dia por causa do fuso", () => {
    expect(formatLongDate("2023-02-01")).toBe("1 de fevereiro de 2023");
    expect(formatShortDate("2026-01-01T00:30:00")).toBe("01/01/2026");
  });

  it("mostra data e hora", () => {
    expect(formatDateTime("2023-02-01T12:05:00")).toBe("01/02/2023, às 12h05");
  });

  it("recusa data inválida", () => {
    expect(() => formatLongDate("01/02/2023")).toThrow(/Data inválida/);
  });
});

describe("números", () => {
  it("usa ponto como separador de milhar", () => {
    expect(formatInteger(1128)).toBe("1.128");
  });

  it("porcentagem com uma casa e vírgula", () => {
    expect(formatPercent(0.8143)).toBe("81,4%");
    expect(formatPercent(1)).toBe("100,0%");
  });

  it("sem dado nunca vira zero", () => {
    expect(formatPercent(null)).toBe("sem dado");
  });

  it("concorda singular e plural", () => {
    expect(plural(1, "votação", "votações")).toBe("1 votação");
    expect(plural(1128, "votação", "votações")).toBe("1.128 votações");
  });
});

describe("dinheiro", () => {
  it("formata reais com centavos", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
  });

  it("compacta valores grandes", () => {
    expect(formatBRLCompact(1_234_567)).toBe("R$ 1,2 mi");
    expect(formatBRLCompact(52_340)).toBe("R$ 52,3 mil");
    expect(formatBRLCompact(950.4)).toBe("R$ 950");
    expect(formatBRLCompact(2_500_000_000)).toBe("R$ 2,5 bi");
    expect(formatBRLCompact(-1_500)).toBe("−R$ 1,5 mil");
  });
});
