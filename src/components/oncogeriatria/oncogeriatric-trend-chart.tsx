export interface TrendPoint {
  at: Date;
  value: number;
  label?: string | null;
}

export function OncogeriatricTrendChart({ title, unit, points }: { title: string; unit?: string; points: TrendPoint[] }) {
  const ordered = [...points].sort((a, b) => a.at.getTime() - b.at.getTime());
  if (!ordered.length) return <article className="card"><h2>{title}</h2><p>Sem dados registrados.</p></article>;
  const values = ordered.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const width = 520;
  const height = 150;
  const pad = 18;
  const x = (index: number) => ordered.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (ordered.length - 1));
  const y = (value: number) => height - pad - ((value - min) / span) * (height - pad * 2);
  const polyline = ordered.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  return (
    <article className="card oncogeriatric-chart">
      <h2>{title}</h2>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Trajetória de ${title}: ${ordered.map((point) => `${point.value}${unit ? ` ${unit}` : ""} em ${point.at.toLocaleDateString("pt-BR")}`).join("; ")}`}>
        <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="3" />
        {ordered.map((point, index) => <circle key={`${point.at.toISOString()}-${index}`} cx={x(index)} cy={y(point.value)} r="5" fill="currentColor" />)}
      </svg>
      <table><thead><tr><th scope="col">Data</th><th scope="col">Valor</th><th scope="col">Contexto</th></tr></thead><tbody>{ordered.map((point, index) => <tr key={`${point.at.toISOString()}-row-${index}`}><td>{point.at.toLocaleDateString("pt-BR")}</td><td>{point.value}{unit ? ` ${unit}` : ""}</td><td>{point.label ?? "—"}</td></tr>)}</tbody></table>
    </article>
  );
}
