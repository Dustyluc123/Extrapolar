import { describe, expect, it } from "vitest";
import { csvToObjects, parseCsv } from "../src/lib/csv";

describe("parseCsv", () => {
  it("lê campos entre aspas com separador, aspas e quebra de linha dentro", () => {
    const text = '﻿"a";"b";"c"\r\n"1";"x;y";"diz ""oi"""\n"2";"linha\nnova";""\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b", "c"],
      ["1", "x;y", 'diz "oi"'],
      ["2", "linha\nnova", ""],
    ]);
  });

  it("aceita campos sem aspas e última linha sem quebra", () => {
    expect(parseCsv("a;b\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("csvToObjects", () => {
  it("usa o cabeçalho e falha com mensagem clara se faltar coluna", () => {
    expect(
      csvToObjects(
        [
          ["a", "b"],
          ["1", "2"],
        ],
        "t",
      ),
    ).toEqual([{ a: "1", b: "2" }]);
    expect(() => csvToObjects([["a", "b"], ["1"]], "t")).toThrow(
      /linha 2 tem 1 colunas, esperado 2/,
    );
  });
});
