import { describe, expect, it } from "vitest";
import { foldText } from "../src/index";

describe("foldText", () => {
  it("ignora acentos, maiúsculas e sublinhados", () => {
    expect(foldText("Exercício")).toBe("exercicio");
    expect(foldText("FIM_MANDATO")).toBe("fim mandato");
    expect(foldText("  São   Paulo ")).toBe("sao paulo");
  });
});
