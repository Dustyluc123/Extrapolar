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
    slug: "medida-provisoria",
    term: "Medida Provisória",
    short: "MPV",
    definition:
      "Norma editada pelo Presidente da República que já vale como lei desde a publicação. O Congresso tem até 120 dias para aprová-la (às vezes com mudanças, na forma de um projeto de lei de conversão) ou ela perde a validade.",
    plain: "É uma lei que começa a valer antes de ser votada.",
  },
  {
    slug: "substitutivo",
    term: "Substitutivo",
    definition:
      "Texto que substitui por inteiro a proposta original, em geral escrito pelo relator. Quando o plenário aprova o substitutivo, é ele que segue adiante, e não o texto original.",
    plain: "É a versão reescrita do projeto.",
  },
  {
    slug: "maioria-absoluta",
    term: "Maioria absoluta",
    definition:
      "Mais da metade de todos os deputados, e não só dos presentes: 257 dos 513. É o mínimo de votos Sim para aprovar um projeto de lei complementar, mesmo que os votos Sim sejam mais numerosos que os Não.",
  },
  {
    slug: "dois-turnos",
    term: "Dois turnos",
    definition:
      "Uma proposta de emenda à Constituição é votada duas vezes no plenário da Câmara (e duas no Senado). Nas duas, precisa de três quintos dos deputados, 308 votos Sim.",
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
  {
    slug: "ric",
    term: "Requerimento de Informação",
    short: "RIC",
    definition:
      "Pedido formal de um deputado a um ministro ou órgão do governo federal para que explique algo por escrito. Pela Constituição, a autoridade tem prazo para responder.",
    plain: "É o deputado perguntando oficialmente ao governo: “me explica isso aqui?”.",
  },
  {
    slug: "pfc",
    term: "Proposta de Fiscalização e Controle",
    short: "PFC",
    definition:
      "Proposta para que uma comissão da Câmara fiscalize um ato ou gasto do Poder Executivo, podendo pedir auditorias ao Tribunal de Contas da União.",
  },
  {
    slug: "convocacao",
    term: "Convocação de ministro",
    definition:
      "Pedido aprovado pela Câmara ou por uma comissão para que um ministro ou autoridade compareça e preste explicações. Diferente do convite, o comparecimento é obrigatório.",
  },
  {
    slug: "inc",
    term: "Indicação",
    short: "INC",
    definition:
      "Sugestão formal de um deputado ao Poder Executivo (ou a outro órgão) para que tome alguma providência. Não obriga o governo a agir nem a responder.",
    plain: "É uma “sugestão por escrito” para o governo.",
  },
  {
    slug: "ceap",
    term: "Cota para o Exercício da Atividade Parlamentar",
    short: "CEAP",
    definition:
      "Verba mensal de cada deputado para despesas do mandato (passagens, combustível, escritório no estado, divulgação). O valor varia por estado e o saldo de um mês pode ser usado nos meses seguintes do mesmo ano.",
    plain: "É o “cartão corporativo” do mandato, pago por reembolso com nota fiscal.",
  },
  {
    slug: "verba-de-gabinete",
    term: "Verba de gabinete",
    definition:
      "Valor mensal que cada deputado tem para pagar os salários da equipe do gabinete. É separado da cota parlamentar.",
  },
  {
    slug: "secretario-parlamentar",
    term: "Secretário parlamentar",
    definition:
      "Funcionário contratado pelo deputado para trabalhar no gabinete, em Brasília ou no estado. Cada gabinete pode ter de 5 a 25 (Ato da Mesa nº 72/1997).",
  },
  {
    slug: "emenda-individual",
    term: "Emenda individual",
    definition:
      "Parte do Orçamento federal que cada deputado e senador pode indicar onde será gasta. Parte do valor tem de ir para a saúde.",
  },
  {
    slug: "transferencia-especial",
    term: "Transferência especial",
    definition:
      "Tipo de emenda individual em que o dinheiro vai direto para o estado ou município, sem um projeto ou convênio definido na própria emenda. É popularmente chamada de “emenda Pix”.",
  },
  {
    slug: "emenda-de-bancada",
    term: "Emenda de bancada",
    definition:
      "Emenda ao Orçamento apresentada em conjunto pelos deputados e senadores de um mesmo estado. Não pertence a um único parlamentar.",
  },
  {
    slug: "empenho",
    term: "Empenho, liquidação e pagamento",
    definition:
      "As etapas do gasto público: o empenho reserva o dinheiro no Orçamento; a liquidação confirma que o serviço ou a obra foi entregue; o pagamento é a saída do dinheiro. O que fica empenhado e não é pago no ano vira “restos a pagar”.",
    plain: "Empenhar é “separar o dinheiro”; pagar é “o dinheiro sair de fato”.",
  },
  {
    slug: "frente-parlamentar",
    term: "Frente parlamentar",
    definition:
      "Associação de deputados (e, nas frentes mistas, também senadores) para promover um tema. É registrada na Câmara com a assinatura de um mínimo de parlamentares.",
  },
  {
    slug: "lider",
    term: "Líder e vice-líder",
    definition:
      "O líder fala em nome de um partido, bloco, do Governo, da Maioria, da Minoria ou da Oposição e orienta o voto da bancada. Os vice-líderes o substituem e ajudam nessa tarefa.",
  },
];

export function glossaryEntry(slug: string): GlossaryEntry {
  const entry = GLOSSARY.find((item) => item.slug === slug);
  if (!entry) throw new Error(`Termo "${slug}" não existe no glossário (src/lib/glossary.ts).`);
  return entry;
}
