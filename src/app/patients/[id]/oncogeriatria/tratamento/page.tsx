import { TreatmentCourseForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, readStructuredRecord, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

export default async function OncogeriatricTreatmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico antes de registrar tratamento.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · tratamento</p><h1>Trajetória terapêutica</h1><p>{patient.fullName} · {episode.diagnosis}. Antineoplásicos e esquemas ficam nesta trajetória e não são transformados em medicação crônica do paciente.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Registrar curso</h2><TreatmentCourseForm patientId={patientId} episodeId={episode.id} /></article>
        <article className="panel"><h2>Cursos registrados</h2>{workspace.courses.length ? <ul className="clean-list">{workspace.courses.map((course) => {
          const flags = readStructuredRecord(course.riskFlags).selected;
          return <li key={course.id}><strong>{course.regimenName}</strong><span>{course.modality} · {course.intent} · {course.status}<br />início: {formatClinicalDate(course.actualStartAt ?? course.plannedStartAt)} · ciclos previstos: {course.plannedCycles ?? "não registrado"}<br />riscos selecionados manualmente: {Array.isArray(flags) && flags.length ? flags.join(", ") : "nenhum registrado"}</span></li>;
        })}</ul> : <p className="muted">Nenhum curso terapêutico registrado.</p>}</article>
      </section>
      <section className="notice"><strong>Proteção de decisão clínica</strong><span>Riscos dependentes do tratamento são selecionados manualmente nesta versão. O sistema não infere toxicidade pelo nome do antineoplásico e não escolhe, reduz, suspende ou troca esquema.</span></section>
    </main>
  );
}
