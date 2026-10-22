import { describe, expect, it } from "vitest";
import { isCoordinatorRole, rolesInPeriod, summarizeFronts } from "../src/index";

describe("frentes", () => {
  it("reconhece coordenador, inclusive com a grafia do arquivo oficial", () => {
    expect(isCoordinatorRole("Coordenador")).toBe(true);
    expect(isCoordinatorRole("Coordernador")).toBe(true);
    expect(isCoordinatorRole("Membro")).toBe(false);
  });

  it("conta frentes sem repetir e lista as coordenadas", () => {
    expect(
      summarizeFronts([
        { frontId: 3, role: "Membro" },
        { frontId: 1, role: "Coordernador" },
        { frontId: 3, role: "Membro" },
        { frontId: 2, role: "Membro" },
      ]),
    ).toEqual({ total: 3, coordinated: [1], all: [1, 2, 3] });
  });
});

describe("rolesInPeriod", () => {
  it("fica com cargos que tocam o período, em ordem", () => {
    const roles = [
      { name: "b", start: "2025-02-01", end: null },
      { name: "antigo", start: "2019-02-01", end: "2021-02-01" },
      { name: "a", start: "2021-02-01", end: "2023-02-01" },
    ];
    expect(rolesInPeriod(roles, "2023-02-01", "2026-10-22").map((r) => r.name)).toEqual(["a", "b"]);
  });
});
