// Leitor de CSV simples e estrito (RFC 4180 com separador configurável): respeita aspas,
// aspas escapadas ("") e separador ou quebra de linha dentro de campos entre aspas.

export function parseCsv(text: string, separator = ";"): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // remove BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;
  while (i < input.length) {
    const char = input[i] as string;
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"' && field === "") {
      quoted = true;
      i++;
    } else if (char === separator) {
      row.push(field);
      field = "";
      i++;
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      i += char === "\r" && input[i + 1] === "\n" ? 2 : 1;
    } else {
      field += char;
      i++;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Converte linhas em objetos usando a primeira linha como cabeçalho. Falha se o número de colunas variar. */
export function csvToObjects(rows: string[][], label: string): Record<string, string>[] {
  const [header, ...data] = rows;
  if (!header) return [];
  return data.map((row, index) => {
    if (row.length !== header.length) {
      throw new Error(
        `CSV ${label}: linha ${index + 2} tem ${row.length} colunas, esperado ${header.length}.`,
      );
    }
    return Object.fromEntries(header.map((name, i) => [name, row[i] as string]));
  });
}
