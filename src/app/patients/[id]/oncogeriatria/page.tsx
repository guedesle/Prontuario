import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { StartEpisodeForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import {
  formatClinicalDate,
  hasRelevantCheckpointAlert,
  loadEpisodeWorkspace,
  loadOncogeriatricEpisodes,
  loadOncogeriatricPatient,
  requireOncogeriatricReadAccess,
  resolveOncogeriatricEpisode,
} from "@/server/oncogeriatria/read";

function scaleForCheckpoint(
  ids: (string | null)[],
  assessments: { id: string; scoreText: string | null; scoreNumeric: unknown; classification: string | null }[],
) {
  for (const id of ids.filter(Boolean).reverse()) {
    const assessment = assessments.find((item) => item.id === id);
    if (assessment) return assessment;
  }
  return null;
}

export default async function OncogeriatricPatientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episodes = await loadOncogeriatricEpisodes(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);

  if (!episode) {
    return (
      <main className="shell narrow-shell">
        <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · ingresso manual</p><h1>{patient.fullName}</h1><p>Este paciente ainda não possui episódio oncogeriátrico. A inclusão depende de confirmação médica explícita e não é determinada pela idade.</p></header>
        <section className="panel form-panel"><h2>Iniciar episódio oncológico</h2><StartEpisodeForm patientId={patientId} /></section>
        <p><a href="/oncogeriatria">← Voltar à Oncogeriatria</a></p>
      </main>
    );
  }

  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const currentCourse = workspace.courses.find((course) => course.status === "ACTIVE") ?? workspace.courses[0];
  const latestCheckpoint = workspace.checkpoints[workspace.checkpoints.length - 1];
  const g8 = scaleForCheckpoint(workspace.checkpoints.map((checkpoint) => checkpoint.g8AssessmentId), workspace.scaleAssessments);
  const carg = scaleForCheckpoint(workspace.checkpoints.map((checkpoint) => checkpoint.cargAssessmentId), workspace.scaleAssessments);
  const latestRelevantEvent = workspace.toxicities[0] ?? null;
  const activeAlerts = [
    workspace.checkpoints.some((checkpoint) => hasRelevantCheckpointAlert(checkpoint.structuredData)) ? "Mudança registrada no Oncogeriatric Check" : null,
    workspace.toxicities.some((item) => item.hospitalizationAssociated) ? "Hospitalização associada a evento registrado" : null,
    workspace.toxicities.length ? "Toxicidade relevante registrada" : null,
  ].filter(Boolean) as string[];

  return (
    <main className="shell">
      <header className="hero compact-hero">
        <p className="eyebrow">Oncogeriatria · prontuário longitudinal</p>
        <h1>{patient.fullName}</h1>
        <p>Um paciente, um Patient.id, múltiplos episódios oncológicos quando necessário. O módulo organiza trajetória e vulnerabilidades sem decidir tratamento antineoplásico.</p>
      </header>

      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />

      {episodes.length > 1 ? <section className="panel"><div className="section-heading"><div><p className="eyebrow">Episódios</p><h2>História oncológica</h2></div></div><ul className="clean-list">{episodes.map((item) => <li key={item.id}><a href={`/patients/${patientId}/oncogeriatria?episode=${item.id}`}>{item.diagnosis}</a><span>{item.primarySite ?? "Sítio não registrado"} · {item.status} · criado em {formatClinicalDate(item.createdAt)}</span></li>)}</ul></section> : null}

      <section className="panel" aria-labelledby="oncologic-block-title">
        <div className="section-heading"><div><p className="eyebrow">Bloco oncológico</p><h2 id="oncologic-block-title">Diagnóstico e tratamento</h2></div><a href={`/patients/${patientId}/oncogeriatria/tratamento?episode=${episode.id}`}>Editar trajetória →</a></div>
        <div className="metrics">
          <article><span>Diagnóstico</span><strong>{episode.primarySite ?? episode.diagnosis}</strong><small>{episode.histology ?? "Histologia não registrada"} · {episode.stage ?? "Estágio não registrado"}</small></article>
          <article><span>Tratamento</span><strong>{currentCourse?.regimenName ?? "Não registrado"}</strong><small>{currentCourse?.intent ?? "Intenção não registrada"} · {currentCourse?.therapyLine ?? "linha não registrada"}</small></article>
          <article><span>Último checkpoint</span><strong>{latestCheckpoint ? formatClinicalDate(latestCheckpoint.occurredAt) : "—"}</strong><small>{latestCheckpoint?.type ?? "Nenhum checkpoint"}</small></article>
          <article><span>Ciclo atual</span><strong>{latestCheckpoint?.cycleNumber ?? "—"}</strong><small>{currentCourse?.plannedCycles ? `de ${currentCourse.plannedCycles} previstos` : "Ciclos previstos não registrados"}</small></article>
        </div>
      </section>

      {activeAlerts.length ? <section className="visible-alerts" role="status"><strong>Mudança clinicamente relevante identificada. Reavaliação médica indicada.</strong><ul>{activeAlerts.map((alert) => <li key={alert}>{alert}</li>)}</ul></section> : null}

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Painel oncogeriátrico</p><h2>Estado atual</h2></div><a href={`/patients/${patientId}/oncogeriatria/longitudinal?episode=${episode.id}`}>Ver Δ geriátrico →</a></div>
        <div className="metrics">
          <article><span>G8</span><strong>{g8?.scoreText ?? "Não avaliado"}</strong><small>{g8?.classification ?? "Sem classificação"}</small></article>
          <article><span>CARG</span><strong>{carg?.scoreText ?? "Não avaliado"}</strong><small>{carg?.classification ?? "Sem classificação"}</small></article>
          <article><span>Eventos</span><strong>{workspace.toxicities.length}</strong><small>{latestRelevantEvent ? `${latestRelevantEvent.toxicityType} · ${formatClinicalDate(latestRelevantEvent.occurredAt)}` : "Nenhum evento registrado"}</small></article>
          <article><span>Intervenções</span><strong>{workspace.interventions.filter((item) => item.status !== "COMPLETED").length}</strong><small>ativas/pendentes</small></article>
        </div>
      </section>

      <section className="two-columns">
        <article className="panel"><h2>Checkpoint recente</h2>{latestCheckpoint ? <><p><strong>{latestCheckpoint.type}</strong> · {formatClinicalDate(latestCheckpoint.occurredAt)}</p><p className="muted">Status: {latestCheckpoint.status}. Consulte a área Check para os detalhes estruturados.</p></> : <p className="muted">Sem dados registrados.</p>}</article>
        <article className="panel"><h2>Princípio de decisão</h2><p>G8, CARG, tendências e alertas são apoio à decisão clínica compartilhada. O sistema não indica, contraindica, reduz, suspende nem modifica esquema antineoplásico.</p></article>
      </section>
    </main>
  );
}
