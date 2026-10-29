// Comparação entre os partidos escolhidos no "Monte seu ranking" (ADR 0010). Mostra a mediana da
// nota de cada partido com os critérios de quem montou o ranking, e a variação (menor e maior).
// Partidos sempre em ordem alfabética, todos com a mesma tinta: o site não ordena partidos.
import { GROUP_SMALL_BASE, summarizeGroups, type RankingResult } from "@extrapolar/metrics";

const oneDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("pt-BR");
const deputies = (n: number) => `${integer.format(n)} ${n === 1 ? "deputado" : "deputados"}`;

interface Props {
  result: RankingResult;
  parties: string[];
  partyOf: (id: number) => string | undefined;
  /** Há filtro de estado: só os deputados desses estados entram na conta. */
  statesFiltered: boolean;
}

export function PartyComparison({ result, parties, partyOf, statesFiltered }: Props) {
  const groups = summarizeGroups({ result, groups: parties, groupOf: partyOf });
  return (
    <section className="clipping mt-5" aria-labelledby="rk-comparacao">
      <h3 id="rk-comparacao" className="m-0 font-display text-xl font-[700]">
        Comparação entre os partidos escolhidos
      </h3>
      <p className="caption m-0 mt-1">
        Calculada com os seus critérios: para cada partido, a mediana das notas dos deputados que
        entraram na conta, com a menor e a maior nota. Partido atual de cada deputado
        {statesFiltered ? ", só nos estados escolhidos" : ""}. Os partidos aparecem em ordem
        alfabética. <a href="/metodologia#comparacao-partidos">Como é calculada</a>
      </p>
      <ul className="m-0 mt-3 list-none p-0">
        {groups.map((g) => (
          <li key={g.group} className="border-t border-rule py-3">
            <p className="m-0">
              <span className="font-semibold">{g.group}</span>
              {g.median !== null ? (
                <>
                  {" "}
                  — com os seus critérios, a mediana do partido {g.group} ficou em{" "}
                  <strong>{oneDecimal.format(g.median)}</strong>
                  {g.included === 1
                    ? " (um deputado só na conta)."
                    : g.min === g.max
                      ? " (todas as notas iguais)."
                      : ` (notas de ${oneDecimal.format(g.min!)} a ${oneDecimal.format(g.max!)}).`}
                </>
              ) : (
                <> — nenhum deputado deste partido entrou na conta, então não há mediana.</>
              )}
            </p>
            {g.median !== null ? <RangeBar min={g.min!} median={g.median} max={g.max!} /> : null}
            <p className="caption m-0 mt-1">
              {deputies(g.included)} na conta
              {g.excluded > 0 ? `; ${deputies(g.excluded)} fora por "sem dado"` : ""}
              {g.included === 0 && g.excluded === 0 ? " (nenhum deputado passa pelos filtros)" : ""}
              .
            </p>
            {g.smallBase ? (
              <p className="caption m-0">
                Base pequena: menos de {GROUP_SMALL_BASE} deputados na conta. Um deputado a mais ou
                a menos pode mudar bastante a mediana.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Régua de 0 a 100: traço da menor à maior nota e marca na mediana. Só ilustra o texto acima. */
function RangeBar({ min, median, max }: { min: number; median: number; max: number }) {
  return (
    <div className="range-bar mt-2" aria-hidden="true">
      <span className="range-bar-span" style={{ left: `${min}%`, width: `${max - min}%` }} />
      <span className="range-bar-median" style={{ left: `${median}%` }} />
      <span className="range-bar-tick" style={{ left: "0%" }}>
        0
      </span>
      <span className="range-bar-tick" style={{ left: "100%" }}>
        100
      </span>
    </div>
  );
}
