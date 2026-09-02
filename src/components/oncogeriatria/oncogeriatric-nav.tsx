const links = [
  ["Resumo", ""],
  ["Basal", "/basal"],
  ["Tratamento", "/tratamento"],
  ["Check", "/check"],
  ["Intervenções", "/intervencoes"],
  ["Longitudinal", "/longitudinal"],
  ["Pós-tratamento", "/pos-tratamento"],
  ["Relatório", "/relatorio"],
] as const;

export function OncogeriatricNav({ patientId, episodeId }: { patientId: string; episodeId?: string | null }) {
  const suffix = episodeId ? `?episode=${encodeURIComponent(episodeId)}` : "";
  return (
    <nav className="panel" aria-label="Navegação da Oncogeriatria">
      <div className="program55-nav">
        {links.map(([label, path]) => (
          <a key={label} href={`/patients/${patientId}/oncogeriatria${path}${suffix}`}>{label}</a>
        ))}
      </div>
    </nav>
  );
}
