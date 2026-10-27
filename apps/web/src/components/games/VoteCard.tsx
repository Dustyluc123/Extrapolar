// Peças da votação usadas nos jogos 2, 3 e 4: links oficiais e a barra do placar.
// (O documento da votação na mesa fica em desk/Oficio.tsx.)

export function propositionUrl(id: number): string {
  return `https://www.camara.leg.br/propostas-legislativas/${id}`;
}
export function voteDataUrl(voteId: string): string {
  return `https://dadosabertos.camara.leg.br/api/v2/votacoes/${voteId}`;
}

/** Barra do placar: Sim (tinta) e Não (hachurado), com os números escritos. */
export function ScoreBar({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  const yesPct = total > 0 ? (yes / total) * 100 : 0;
  return (
    <div>
      <div className="score-bar" role="img" aria-label={`Sim: ${yes} votos; Não: ${no} votos`}>
        <span className="score-yes" style={{ width: `${yesPct}%` }}>
          {yesPct >= 18 ? `Sim ${yes}` : ""}
        </span>
        <span className="score-no">{100 - yesPct >= 18 ? `Não ${no}` : ""}</span>
      </div>
    </div>
  );
}
