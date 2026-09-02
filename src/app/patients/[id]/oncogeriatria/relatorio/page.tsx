import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { OncogeriatricReportActions } from "@/components/oncogeriatria/report-actions";
import { ReportSnapshotButton } from "@/components/oncogeriatria/oncogeriatric-forms";
import { buildProfessionalIdentity } from "@/domain/professional-identity";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, readStructuredRecord, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

function latestAssessmentByIds(ids: (string | null)[], assessments: { id: string; scaleCode: string; scoreText: string | null; classification: string | null; appliedAt: Date }[]) {
  for (const id of ids.filter(Boolean).reverse()) {
    const found = assessments.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

function scaleTrajectory(codeFragment: string, assessments: { scaleCode: string; scaleVersion: string; scoreText: string | null; scoreNumeric: unknown; appliedAt: Date }[]) {
  const candidates = assessments.filter((item) => item.scaleCode.toUpperCase().includes(codeFragment.toUpperCase()));
  if (!candidates.length) return "Não avaliado";
  const version = candidates[candidates.length - 1]?.scaleVersion;
  const compatible = candidates.filter((item) => item.scaleVersion === version);
  const first = compatible[0];
  const last = compatible[compatible.length - 1];
  const display = (item: typeof first) => item?.scoreText ?? (item?.scoreNumeric !== null && item?.scoreNumeric !== undefined ? String(item.scoreNumeric) : "sem escore");
  return first && last ? `${display(first)} → ${display(last)} (versão ${version})` : "Não avaliado";
}

export default async function OncogeriatricReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  const { user } = await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico antes de gerar o relatório.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const professional = buildProfessionalIdentity({ name: user.name, email: user.email, brandOwnerEmail: process.env.PROFESSIONAL_BRAND_OWNER_EMAIL });
  const currentCourse = workspace.courses.find((item) => item.status === "ACTIVE") ?? workspace.courses[0];
  const latestCheckpoint = workspace.checkpoints[workspace.checkpoints.length - 1];
  const g8 = latestAssessmentByIds(workspace.checkpoints.map((item) => item.g8AssessmentId), workspace.scaleAssessments);
  const carg = latestAssessmentByIds(workspace.checkpoints.map((item) => item.cargAssessmentId), workspace.scaleAssessments);
  const baseline = workspace.checkpoints.find((item) => item.type === "PRE_TREATMENT");
  const baselineData = readStructuredRecord(baseline?.structuredData);
  const whatMatters = typeof baselineData.whatMatters === "string" && baselineData.whatMatters.trim() ? baselineData.whatMatters : "Não registrado";
  const activeInterventions = workspace.interventions.filter((item) => item.status !== "COMPLETED").slice(0, 3);
  const recentEvents = workspace.toxicities.slice(0, 3);
  const changes = latestCheckpoint ? readStructuredRecord(latestCheckpoint.structuredData) : {};
  const reportDate = new Date();

  const snapshotContent = {
    schemaVersion: "oncogeriatria-report-v1",
    generatedAt: reportDate.toISOString(),
    patientId,
    episodeId: episode.id,
    diagnosis: { diagnosis: episode.diagnosis, primarySite: episode.primarySite, histology: episode.histology, stage: episode.stage },
    treatment: currentCourse ? { regimenName: currentCourse.regimenName, intent: currentCourse.intent, therapyLine: currentCourse.therapyLine, status: currentCourse.status } : null,
    g8: g8 ? { score: g8.scoreText, classification: g8.classification } : null,
    carg: carg ? { score: carg.scoreText, classification: carg.classification } : null,
    trajectories: { abvd: scaleTrajectory("ABVD", workspace.scaleAssessments), aivd: scaleTrajectory("AIVD", workspace.scaleAssessments), nutrition: scaleTrajectory("MNA", workspace.scaleAssessments) },
    activeInterventions: activeInterventions.map((item) => ({ domain: item.domain, description: item.description, intervention: item.intervention, status: item.status })),
    recentEvents: recentEvents.map((item) => ({ type: item.toxicityType, occurredAt: item.occurredAt.toISOString(), grade: item.grade, hospitalizationAssociated: item.hospitalizationAssociated })),
    whatMatters,
  };

  return (
    <main className="shell">
      <header className="hero compact-hero no-print"><p className="eyebrow">Oncogeriatria · comunicação médica</p><h1>Resumo oncogeriátrico</h1><p>Prévia compacta para comunicação com oncologia. Revise clinicamente antes de copiar, imprimir ou gerar snapshot.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <div className="report-actions no-print"><OncogeriatricReportActions /><ReportSnapshotButton patientId={patientId} episodeId={episode.id} content={snapshotContent} /></div>

      <article id="oncogeriatric-report" className="aga-report">
        <header><p className="eyebrow">Prontuário Aprimorado · Oncogeriatria</p><h1>Resumo oncogeriátrico</h1><p><strong>Paciente:</strong> {patient.fullName} · <strong>Data:</strong> {formatClinicalDate(reportDate)}</p><p><strong>Profissional:</strong> {professional.displayName} · {professional.roleLabel}</p></header>
        <section><h2>Diagnóstico oncológico</h2><p>{episode.diagnosis}{episode.primarySite ? ` · sítio: ${episode.primarySite}` : ""}{episode.histology ? ` · histologia: ${episode.histology}` : ""}{episode.stage ? ` · estágio: ${episode.stage}` : ""}</p></section>
        <section><h2>Tratamento atual e fase</h2><p>{currentCourse ? `${currentCourse.regimenName} · ${currentCourse.intent} · ${currentCourse.therapyLine ?? "linha não registrada"} · ${currentCourse.status}` : "Tratamento não registrado"}</p><p>Último checkpoint: {latestCheckpoint ? `${latestCheckpoint.type} · ${formatClinicalDate(latestCheckpoint.occurredAt)}` : "Não registrado"}</p></section>
        <section className="two-columns"><div><h2>G8</h2><p>{g8 ? `${g8.scoreText ?? "sem escore"} · ${g8.classification ?? "sem classificação"}` : "Não avaliado"}</p></div><div><h2>CARG</h2><p>{carg ? `${carg.scoreText ?? "sem escore"} · ${carg.classification ?? "sem classificação"}` : "Não avaliado"}</p><p className="muted">Estimativa de risco para apoio à decisão clínica compartilhada.</p></div></section>
        <section><h2>Trajetória geriátrica</h2><table><thead><tr><th scope="col">Domínio</th><th scope="col">Baseline → atual</th></tr></thead><tbody><tr><th scope="row">Estado funcional — ABVD</th><td>{scaleTrajectory("ABVD", workspace.scaleAssessments)}</td></tr><tr><th scope="row">Estado funcional — AIVD</th><td>{scaleTrajectory("AIVD", workspace.scaleAssessments)}</td></tr><tr><th scope="row">Estado nutricional — MNA</th><td>{scaleTrajectory("MNA", workspace.scaleAssessments)}</td></tr><tr><th scope="row">Mobilidade</th><td>{scaleTrajectory("10-CS", workspace.scaleAssessments)}</td></tr><tr><th scope="row">Cognição</th><td>{scaleTrajectory("MEEM", workspace.scaleAssessments)}</td></tr></tbody></table></section>
        <section><h2>Principais vulnerabilidades / intervenções</h2>{activeInterventions.length ? <ol>{activeInterventions.map((item) => <li key={item.id}><strong>{item.domain}:</strong> {item.description}{item.intervention ? ` — ${item.intervention}` : ""}</li>)}</ol> : <p>Sem intervenção ativa registrada.</p>}</section>
        <section><h2>Mudanças desde o último checkpoint</h2><pre className="report-structured-summary">{Object.keys(changes).length ? JSON.stringify(changes, null, 2) : "Sem dados estruturados registrados."}</pre></section>
        <section><h2>Eventos relevantes</h2>{recentEvents.length ? <ul>{recentEvents.map((event) => <li key={event.id}>{formatClinicalDate(event.occurredAt)} · {event.toxicityType}{event.grade ? ` · grau ${event.grade}` : ""}{event.hospitalizationAssociated ? " · hospitalização associada" : ""}</li>)}</ul> : <p>Nenhum evento relevante registrado.</p>}</section>
        <section><h2>Questões para discussão com oncologia</h2><p>Campo destinado à discussão clínica humana. O sistema não propõe ajuste automático de dose, intervalo ou esquema.</p></section>
        <section><h2>Objetivo prioritário informado pelo paciente</h2><p>{whatMatters}</p></section>
        <footer><p className="muted">Documento de apoio à comunicação médica. Condutas oncológicas permanecem sob decisão clínica humana.</p></footer>
      </article>
    </main>
  );
}
