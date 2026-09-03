import { DomainLinkedOncogeriatricCheckForm } from "@/components/oncogeriatria/domain-linked-check-form";
import { OncogeriatricDomainStatusSummary } from "@/components/oncogeriatria/domain-status-summary";
import { ToxicityForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { capacityHistoryForOncogeriatricEpisode, formatClinicalDate, hasRelevantCheckpointAlert, loadEpisodeWorkspace, loadOncogeriatricPatient, readStructuredRecord, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

export default async function OncogeriatricCheckPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico antes de registrar checkpoints.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const capacityHistory = capacityHistoryForOncogeriatricEpisode(patientId, workspace);
  const checks = workspace.checkpoints.filter((item) => item.type === "CYCLE" || item.type === "PERIODIC_REASSESSMENT" || item.type === "EVENT_DRIVEN").reverse();
  const courseOptions = workspace.courses.map((item) => ({ id: item.id, label: `${item.regimenName} · ${item.status}` }));
  const consultationOptions = workspace.consultations.map((item) => ({ id: item.id, label: `${formatClinicalDate(item.occurredAt)} · ${item.status}` }));
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · Check</p><h1>Oncogeriatric Check</h1><p>{patient.fullName}. Avaliação breve, orientada a mudanças desde o último checkpoint, sem substituir reavaliação clínica ampliada quando necessária.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Novo check de ciclo</h2><DomainLinkedOncogeriatricCheckForm patientId={patientId} episodeId={episode.id} courses={courseOptions} consultations={consultationOptions} /></article>
        <article className="panel"><h2>Registrar toxicidade relevante</h2><ToxicityForm patientId={patientId} episodeId={episode.id} courses={courseOptions} /></article>
      </section>
      <OncogeriatricDomainStatusSummary history={capacityHistory} />
      <section className="panel"><div className="section-heading"><div><p className="eyebrow">Histórico</p><h2>Mudanças desde checkpoints anteriores</h2></div></div>{checks.length ? <ul className="clean-list">{checks.map((checkpoint) => {
        const data = readStructuredRecord(checkpoint.structuredData);
        const notes = typeof data.notes === "string" ? data.notes : null;
        return <li key={checkpoint.id}><strong>{formatClinicalDate(checkpoint.occurredAt)} · {checkpoint.type}{checkpoint.cycleNumber ? ` · ciclo ${checkpoint.cycleNumber}` : ""}</strong><span>{hasRelevantCheckpointAlert(checkpoint.structuredData) ? "Mudança relevante registrada — reavaliação médica indicada." : "Sem gatilho estruturado registrado."}{checkpoint.consultationId ? " · avaliação por domínio vinculada à consulta" : " · sem consulta vinculada para domínios"}{notes ? ` · ${notes}` : ""}</span></li>;
      })}</ul> : <p className="muted">Nenhum check registrado.</p>}</section>
      <section className="panel"><h2>Eventos de toxicidade</h2>{workspace.toxicities.length ? <ul className="clean-list">{workspace.toxicities.map((event) => <li key={event.id}><strong>{event.toxicityType} · {formatClinicalDate(event.occurredAt)}</strong><span>grau: {event.grade ?? "não registrado"} · hospitalização: {event.hospitalizationAssociated ? "sim" : "não"} · atraso: {event.cycleDelayAssociated ? "sim" : "não"}{event.treatmentModificationRecorded ? ` · modificação previamente registrada: ${event.treatmentModificationRecorded}` : ""}</span></li>)}</ul> : <p className="muted">Nenhuma toxicidade registrada.</p>}</section>
    </main>
  );
}