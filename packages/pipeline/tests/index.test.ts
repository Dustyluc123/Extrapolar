import { describe, expect, it } from "vitest";
import { describePipeline } from "../src/index";

describe("pipeline", () => {
  it("usa o nome do projeto do pacote compartilhado", () => {
    expect(describePipeline()).toContain("Extrapolar");
  });
});
