// Crachá do jogador na mesa: sequência de dias e estatísticas guardadas neste navegador.
export function Badge({
  role = "Parlamentar por um dia",
  items,
  note = "Contado só neste aparelho.",
}: {
  role?: string;
  items: [label: string, value: number | string][];
  note?: string;
}) {
  return (
    <div className="badge-card" role="group" aria-label="Crachá">
      <span className="badge-slot" aria-hidden="true" />
      <p className="badge-kicker">Crachá · Mesa do Extrapolar</p>
      <p className="badge-role">{role}</p>
      <dl className="badge-stats">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="badge-note">{note}</p>
    </div>
  );
}
