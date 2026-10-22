import { describe, expect, it } from "vitest";
import {
  CURRENT_LEGISLATURE_ID,
  getLegislature,
  legislatureEndDateTime,
  legislatureStartDateTime,
  legislatureYears,
} from "../src/index";

describe("legislatura", () => {
  it("a legislatura atual é a 57ª, de 01/02/2023 a 31/01/2027", () => {
    expect(CURRENT_LEGISLATURE_ID).toBe(57);
    expect(getLegislature()).toEqual({ id: 57, start: "2023-02-01", end: "2027-01-31" });
  });

  it("a 58ª já está cadastrada para a troca", () => {
    expect(getLegislature(58)).toEqual({ id: 58, start: "2027-02-01", end: "2031-01-31" });
  });

  it("monta início e fim como data e hora local", () => {
    const legislature = getLegislature(57);
    expect(legislatureStartDateTime(legislature)).toBe("2023-02-01T00:00:00");
    expect(legislatureEndDateTime(legislature)).toBe("2027-01-31T23:59:59");
  });

  it("lista os anos da legislatura até a data informada", () => {
    const legislature = getLegislature(57);
    expect(legislatureYears(legislature)).toEqual([2023, 2024, 2025, 2026, 2027]);
    expect(legislatureYears(legislature, "2026-10-22T10:00:00")).toEqual([2023, 2024, 2025, 2026]);
  });
});
