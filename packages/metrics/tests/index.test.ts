import { describe, expect, it } from "vitest";
import { safeRatio } from "../src/index";

describe("safeRatio", () => {
  it("divide normalmente quando há total", () => {
    expect(safeRatio(1, 4)).toBe(0.25);
  });

  it("devolve null quando o total é zero", () => {
    expect(safeRatio(0, 0)).toBeNull();
  });
});
