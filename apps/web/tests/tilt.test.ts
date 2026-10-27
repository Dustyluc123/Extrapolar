import { describe, expect, it } from "vitest";
import { inkTilt } from "../src/lib/games/tilt";

describe("inclinação da marca de carimbo", () => {
  it("é sempre a mesma para o mesmo documento", () => {
    expect(inkTilt("2612345-87")).toEqual(inkTilt("2612345-87"));
  });

  it("fica entre 2 e 8 graus, para os dois lados, com deslocamento pequeno", () => {
    const tilts = Array.from({ length: 300 }, (_, i) => inkTilt(`votacao-${i}`));
    for (const t of tilts) {
      expect(Math.abs(t.angle)).toBeGreaterThanOrEqual(2);
      expect(Math.abs(t.angle)).toBeLessThanOrEqual(8);
      expect(Math.abs(t.dx)).toBeLessThanOrEqual(6);
      expect(Math.abs(t.dy)).toBeLessThanOrEqual(6);
    }
    expect(tilts.some((t) => t.angle > 0)).toBe(true);
    expect(tilts.some((t) => t.angle < 0)).toBe(true);
  });

  it("muda de um documento para outro", () => {
    const angles = new Set(Array.from({ length: 50 }, (_, i) => inkTilt(`v${i}`).angle));
    expect(angles.size).toBeGreaterThan(20);
  });
});
