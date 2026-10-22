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
  {
    slug: "sessao-deliberativa",
    term: "Sessão deliberativa",
    definition:
      "Sessão do plenário em que há votação de propostas. As sessões não deliberativas (como as solenes, de homenagem) não têm votação.",
    plain: "É a sessão “de trabalho”, em que se decide alguma coisa.",
  },
  {
    slug: "orientacao-de-bancada",
    term: "Orientação de bancada",
    definition:
      "Recomendação que a liderança de um partido, federação, bloco, do Governo ou da oposição faz aos seus deputados sobre como votar em cada votação: Sim, Não, Obstrução, Abstenção ou voto liberado.",
    plain: "É o “recado do líder” antes de votar. O voto continua sendo de cada deputado.",
  },
  {
    slug: "liberado",
    term: "Voto liberado",
    definition: "Quando a liderança não recomenda um voto e deixa cada deputado decidir sozinho.",
  },
  {
    slug: "lider-do-governo",
    term: "Líder do Governo",
    definition:
      "Deputado indicado pelo Presidente da República para representar o Governo na Câmara. Ele também orienta o voto em cada votação.",
  },
  {
    slug: "federacao",
    term: "Federação partidária",
    definition:
      "União de partidos que atuam juntos, como se fossem um só, durante toda a legislatura. Na Câmara, a federação tem uma liderança e orienta o voto dos deputados dos partidos que a formam.",
  },
  {
    slug: "bloco-parlamentar",
    term: "Bloco parlamentar",
    definition:
      "Aliança de partidos (e federações) formada dentro da Câmara para atuar em conjunto. Pode mudar ao longo da legislatura.",
  },
  {
    slug: "comissao",
    term: "Comissão",
    definition:
      "Grupo menor de deputados que analisa e vota propostas de um tema antes (ou no lugar) do plenário. As permanentes existem sempre (Saúde, Educação...); as especiais são criadas para uma proposta específica; as CPIs investigam um fato determinado.",
    plain: "É onde o assunto é estudado em detalhe antes de ir para a votação de todos.",
  },
  {
    slug: "cpi",
    term: "Comissão Parlamentar de Inquérito",
    short: "CPI",
    definition:
      "Comissão temporária criada para investigar um fato determinado, com poderes de investigação próprios de autoridades judiciais.",
  },
  {
    slug: "audiencia-publica",
    term: "Audiência pública",
    definition:
      "Reunião de uma comissão para ouvir especialistas, autoridades e representantes da sociedade sobre um tema.",
    plain: "É a comissão chamando gente de fora para explicar ou debater um assunto.",
  },
  {
    slug: "requerimento",
    term: "Requerimento",
    short: "REQ",
    definition:
      "Pedido formal de um deputado (por exemplo, para realizar uma audiência pública ou um seminário). Precisa ser aprovado para acontecer.",
  },
  {
    slug: "mesa-diretora",
    term: "Mesa Diretora",
    definition:
      "Grupo de deputados que dirige os trabalhos da Câmara: presidente, vice-presidentes e secretários. É eleita para mandatos de dois anos.",
  },
  {
    slug: "pl",
    term: "Projeto de Lei",
    short: "PL",
    definition:
      "Proposta para criar, mudar ou revogar uma lei ordinária. Precisa ser aprovada pela Câmara e pelo Senado e sancionada pelo Presidente da República.",
  },
  {
    slug: "plp",
    term: "Projeto de Lei Complementar",
    short: "PLP",
    definition:
      "Proposta de lei sobre assuntos que a Constituição exige que sejam tratados por lei complementar. Precisa de maioria absoluta para ser aprovada.",
  },
  {
    slug: "pec",
    term: "Proposta de Emenda à Constituição",
    short: "PEC",
    definition:
      "Proposta para mudar a Constituição. Precisa da assinatura de pelo menos um terço dos deputados para começar e de três quintos dos votos, em dois turnos, na Câmara e no Senado.",
    plain: "É a proposta mais difícil de aprovar: mexe nas regras principais do país.",
  },
  {
    slug: "pdl",
    term: "Projeto de Decreto Legislativo",
    short: "PDL",
    definition:
      "Proposta sobre assuntos que são decididos só pelo Congresso, sem sanção do Presidente — por exemplo, aprovar tratados ou suspender atos do Poder Executivo.",
  },
  {
    slug: "prc",
    term: "Projeto de Resolução da Câmara",
    short: "PRC",
    definition: "Proposta sobre assuntos internos da Câmara, como o seu regimento.",
  },
  {
    slug: "apensado",
    term: "Apensação",
    definition:
      "Quando um projeto trata de assunto parecido com outro que já está tramitando, ele é juntado (apensado) ao mais antigo e os dois passam a andar juntos.",
    plain: "É colocar no mesmo “pacote” projetos sobre o mesmo assunto.",
  },
  {
    slug: "norma-juridica",
    term: "Norma jurídica",
    definition:
      "O resultado final de uma proposta aprovada: uma lei, lei complementar, emenda constitucional, decreto legislativo ou resolução.",
  },
  {
    slug: "relator",
    term: "Relator e parecer",
    definition:
      "Relator é o deputado escolhido para estudar uma proposta numa comissão (ou no plenário). O texto em que ele recomenda aprovar, mudar ou rejeitar a proposta é o parecer.",
  },
  {
    slug: "primeiro-signatario",
    term: "Autor principal (primeiro signatário)",
    definition:
      "O primeiro deputado a assinar uma proposta. Os demais que assinam como autores são coautores; há ainda as assinaturas de apoio, que não são autoria.",
  },
];

export function glossaryEntry(slug: string): GlossaryEntry {
  const entry = GLOSSARY.find((item) => item.slug === slug);
  if (!entry) throw new Error(`Termo "${slug}" não existe no glossário (src/lib/glossary.ts).`);
  return entry;
}
