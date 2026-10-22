import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { publish } from "../src/steps/publish";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "extrapolar-publish-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const schema = z.object({ valor: z.number() });

describe("publish", () => {
  it("grava todos os arquivos válidos em JSON compacto", async () => {
    await publish(dir, [
      { name: "a.json", schema, data: { valor: 1 } },
      { name: "b.json", schema, data: { valor: 2 } },
    ]);
    expect(await readFile(join(dir, "a.json"), "utf8")).toBe('{"valor":1}\n');
    expect((await readdir(dir)).sort()).toEqual(["a.json", "b.json"]);
  });

  it("não grava nada se um dos arquivos for inválido", async () => {
    await writeFile(join(dir, "a.json"), '{"valor":0}\n');
    await expect(
      publish(dir, [
        { name: "a.json", schema, data: { valor: 1 } },
        { name: "b.json", schema, data: { valor: "dois" } },
      ]),
    ).rejects.toThrow(/Dados inválidos em saída b\.json:\n {2}- valor/);
    expect(await readFile(join(dir, "a.json"), "utf8")).toBe('{"valor":0}\n');
    expect(await readdir(dir)).toEqual(["a.json"]);
  });

  it("grava em subpastas e remove sobras só nas pastas do pipeline", async () => {
    await mkdir(join(dir, "deputados"), { recursive: true });
    await writeFile(join(dir, "deputados", "999.json"), '{"valor":9}\n');
    await writeFile(join(dir, "deputados", "LEIA.txt"), "não é json");
    await publish(
      dir,
      [
        { name: "deputados/1.json", schema, data: { valor: 1 } },
        { name: "deputados/2.json", schema, data: { valor: 2 } },
      ],
      { ownedDirs: ["deputados"] },
    );
    expect((await readdir(join(dir, "deputados"))).sort()).toEqual([
      "1.json",
      "2.json",
      "LEIA.txt",
    ]);
  });
});
