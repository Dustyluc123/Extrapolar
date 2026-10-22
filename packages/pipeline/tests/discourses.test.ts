import { describe, expect, it } from "vitest";
import { splitDateRange } from "../src/sources/camara-api";

describe("splitDateRange", () => {
  it("divide vários anos em anos", () => {
    expect(splitDateRange("2023-02-01", "2025-03-10")).toEqual([
      ["2023-02-01", "2023-12-31"],
      ["2024-01-01", "2024-12-31"],
      ["2025-01-01", "2025-03-10"],
    ]);
  });

  it("divide um ano em meses", () => {
    expect(splitDateRange("2026-01-01", "2026-03-15")).toEqual([
      ["2026-01-01", "2026-01-31"],
      ["2026-02-01", "2026-02-28"],
      ["2026-03-01", "2026-03-15"],
    ]);
  });

  it("um mês só não se divide", () => {
    expect(splitDateRange("2026-03-01", "2026-03-31")).toBeNull();
  });
});
