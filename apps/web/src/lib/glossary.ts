// Glossário: termos usados nas fichas, em linguagem simples. Página /glossario.
// Cada caderno da Fase 1 acrescenta os seus termos. Definições descritivas, sem juízo de valor.

export interface GlossaryEntry {
  slug: string;
  term: string;
  /** Sigla ou nome curto, quando houver. */
  short?: string;
  definition: string;
  /** "Traduzindo:" — a ideia numa frase de conversa. */
  plain?: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    slug: "legislatura",
    term: "Legislatura",
    definition:
      "Período de quatro anos do mandato dos deputados. A 57ª legislatura vai de 1º de fevereiro de 2023 a 31 de janeiro de 2027.",
    plain: "É o “mandato da turma” eleita na mesma eleição.",
  },
  {
    slug: "plenario",
    term: "Plenário",
    definition:
      "Reunião de todos os 513 deputados, no salão principal da Câmara. É onde as propostas recebem a votação final da Casa.",
    plain: "É a “sala grande”, onde todo mundo pode votar.",
  },
  {
    slug: "votacao-nominal",
    term: "Votação nominal",
    definition:
      "Votação em que o voto de cada deputado fica registrado com o nome dele, no painel eletrônico.",
    plain: "Dá para saber quem votou e como votou.",
  },
  {
    slug: "votacao-simbolica",
    term: "Votação simbólica",
    definition:
      "Votação em que o presidente da sessão só anuncia o resultado, sem registrar o voto de cada deputado. É a forma mais comum.",
    plain: "Ninguém fica com o voto registrado no nome.",
  },
  {
    slug: "obstrucao",
    term: "Obstrução",
    definition:
      "Registro de que o deputado está em obstrução: um instrumento usado para tentar impedir ou adiar uma votação. Fica registrado como escolha do deputado.",
  },
  {
    slug: "artigo-17",
    term: "Artigo 17",
    definition:
      "Registro feito para quem está presidindo a sessão no momento da votação. Quem preside normalmente não vota.",
  },
  {
    slug: "em-exercicio",
    term: "Em exercício",
    definition:
      "Deputado que está exercendo o mandato naquele momento. Quem se licencia (por exemplo, para ser ministro) deixa de estar em exercício e um suplente assume.",
  },
  {
    slug: "suplente",
    term: "Suplente",
    definition:
      "Candidato que não foi eleito diretamente, mas assume a vaga quando um deputado eleito se licencia ou deixa o cargo.",
    plain: "É o “reserva” que entra em campo quando o titular sai.",
  },
  {
    slug: "titular",
    term: "Titular",
    definition: "Deputado eleito diretamente para a vaga na eleição.",
  },
];

export function glossaryEntry(slug: string): GlossaryEntry {
  const entry = GLOSSARY.find((item) => item.slug === slug);
  if (!entry) throw new Error(`Termo "${slug}" não existe no glossário (src/lib/glossary.ts).`);
  return entry;
}
