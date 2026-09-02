import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { OncogeriatricTrendChart } from "@/components/oncogeriatria/oncogeriatric-trend-chart";
import { buildOncogeriatricDelta, groupComparableObservations } from "@/domain/oncogeriatria/longitudinal";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, readStructuredRecord, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

function dayKey(date: Date): string { return date.toISOString().slice(0, 10); }

export default async function OncogeriatricLongitudinalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico para visualizar a trajetória.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const firstCheckpointAt = workspace.checkpoints[0]?.occurredAt ?? episode.diagnosedAt ?? episode.createdAt;
  const eventsByDay = new Map<string, string[]>();
  const addEvent = (date: Date | null | undefined, label: string) => {
    if (!date) return;
    const key = dayKey(date);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), label]);
  };
  workspace.courses.forEach((course) => addEvent(course.actualStartAt, `Início ${course.regimenName}`));
  workspace.checkpoints.forEach((checkpoint) => addEvent(checkpoint.occurredAt, checkpoint.type === "CYCLE" ? `Ciclo ${checkpoint.cycleNumber ?? ""}`.trim() : checkpoint.type));
  workspace.toxicities.filter((item) => item.hospitalizationAssociated).forEach((item) => addEvent(item.occurredAt, "Hospitalização"));

  const numericObservations = workspace.scaleAssessments
    .filter((item) => item.appliedAt.getTime() >= firstCheckpointAt.getTime() && item.scoreNumeric !== null)
    .map((item) => ({ code: item.scaleCode, version: item.scaleVersion, occurredAt: item.appliedAt, value: Number(item.scoreNumeric) }))
    .filter((item) => Number.isFinite(item.value));
  const scaleGroups = groupComparableObservations(numericObservations);
  const deltas = scaleGroups.map((group) => buildOncogeriatricDelta(group.observations)).filter(Boolean);

  const weightPoints = workspace.checkpoints.flatMap((checkpoint) => {
    const data = readStructuredRecord(checkpoint.structuredData);
    const nutrition = readStructuredRecord(data.nutrition);
    const value = typeof nutrition.weightKg === "number" ? nutrition.weightKg : Number(nutrition.weightKg);
    return Number.isFinite(value) && value > 0 ? [{ at: checkpoint.occurredAt, value, label: (eventsByDay.get(dayKey(checkpoint.occurredAt)) ?? []).join(" · ") }] : [];
  });

  const chartGroups = scaleGroups.filter((group) => group.observations.length >= 1).slice(0, 8);
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · longitudinal</p><h1>Δ geriátrico</h1><p>{patient.fullName} · baseline → tratamento → eventos → intervenção → recuperação. Comparações são feitas apenas entre o mesmo código e a mesma versão do instrumento.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />

      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Mudança temporal</p><h2>Baseline → atual</h2></div><span className="muted">Mudança numérica não é rotulada automaticamente como clinicamente significativa.</span></div>
        {deltas.length ? <div className="evolution-list">{deltas.map((delta) => delta ? <article className="evolution-card" key={`${delta.code}-${delta.version}`}><div><h3>{delta.code}</h3><p className="dimension">versão {delta.version}</p><p className="trend">Δ numérico: {delta.delta > 0 ? "+" : ""}{delta.delta}</p></div><div className="score-block"><span>Baseline</span><strong>{delta.baseline}</strong></div><div className="score-arrow">→</div><div className="score-block current-score"><span>Atual</span><strong>{delta.current}</strong></div><div className="score-block"><span>Período</span><strong>{formatClinicalDate(delta.currentAt)}</strong></div></article> : null)}</div> : <p className="muted">Dados insuficientes para comparação de escalas com código e versão compatíveis.</p>}
      </section>

      <section className="panel"><h2>Linha temporal oncológica</h2>{eventsByDay.size ? <ul className="clean-list">{[...eventsByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, labels]) => <li key={date}><strong>{date.split("-").reverse().join("/")}</strong><span>{labels.join(" · ")}</span></li>)}</ul> : <p className="muted">Sem eventos temporais registrados.</p>}</section>

      <section className="grid" aria-label="Gráficos longitudinais oncogeriátricos">
        <OncogeriatricTrendChart title="Peso" unit="kg" points={weightPoints} />
        {chartGroups.map((group) => <OncogeriatricTrendChart key={`${group.code}-${group.version}`} title={`${group.code} · ${group.version}`} points={group.observations.map((item) => ({ at: item.occurredAt, value: item.value, label: (eventsByDay.get(dayKey(item.occurredAt)) ?? []).join(" · ") }))} />)}
      </section>
    </main>
  );
}
