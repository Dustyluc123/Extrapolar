import { describe, expect, it } from "vitest";
import { PROJECT_NAME } from "../src/index";

describe("shared", () => {
  it("exporta o nome do projeto", () => {
    expect(PROJECT_NAME).toBe("Extrapolar");
  });
});
