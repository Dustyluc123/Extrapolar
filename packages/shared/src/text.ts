// Utilidades de texto usadas no pipeline e no site.

/** Remove acentos, junta espaços e deixa em minúsculas, para comparar textos ("Exercício" = "EXERCICIO"). */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase();
}
