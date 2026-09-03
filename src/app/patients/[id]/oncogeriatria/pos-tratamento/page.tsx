import { CheckpointPlannerForm } from "@/components/oncogeriatria/checkpoint-planner-form";
import { OncogeriatricDomainStatusSummary } from "@/components/oncogeriatria/domain-status-summary";
import { RecoveryForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { capacityHistoryForOncogeriatricEpisode, formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

const labels: Record<string, string> = {
  RECOVERED: "Recuperado", RECOVERING: "Em recuperação", PERSISTENT_DEFICIT: "Déficit persistente", NEW_DEFICIT: "Novo déficit", NOT_ASSESSED: "Não avaliado",
};

export default async function OncogeriatricPostTreatmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico antes de registrar recuperação.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const capacityHistory = capacityHistoryForOncogeriatricEpisode(patientId, workspace);
  const followUps = workspace.checkpoints.filter((item) => item.type === "END_OF_TREATMENT" || item.type.startsWith("POST_"));
  const consultationOptions = workspace.consultations.map((item) => ({ id: item.id, label: `${formatClinicalDate(item.occurredAt)} · ${item.status}` }));
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · transição</p><h1>Pós-tratamento e recuperação</h1><p>{patient.fullName}. Compare o estado final com o baseline e registre a recuperação por domínio sob julgamento profissional.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Mapa de recuperação</h2><RecoveryForm patientId={patientId} episodeId={episode.id} /></article>
        <article className="panel"><h2>Planejar transição/seguimento</h2><CheckpointPlannerForm patientId={patientId} episodeId={episode.id} consultations={consultationOptions} /><p className="muted">Os checkpoints 3, 6 e 12 meses são registros previstos; nenhuma consulta clínica é criada automaticamente.</p></article>
      </section>
      <OncogeriatricDomainStatusSummary history={capacityHistory} />
      <section className="two-columns">
        <article className="panel"><h2>Situação de recuperação registrada pelo médico</h2>{workspace.recovery.length ? <ul className="clean-list">{workspace.recovery.map((item) => <li key={item.id}><strong>{item.domain} · {labels[item.status] ?? item.status}</strong><span>{formatClinicalDate(item.assessedAt)}{item.notes ? ` · ${item.notes}` : ""}</span></li>)}</ul> : <p className="muted">Nenhum domínio de recuperação avaliado.</p>}</article>
        <article className="panel"><h2>Checkpoints de transição/seguimento</h2>{followUps.length ? <ul className="clean-list">{followUps.map((item) => <li key={item.id}><strong>{item.type}</strong><span>referência: {formatClinicalDate(item.occurredAt)} · próximo previsto: {formatClinicalDate(item.scheduledAt)} · {item.status}{item.consultationId ? " · avaliação por domínio vinculada" : " · sem consulta vinculada para domínios"}</span></li>)}</ul> : <p className="muted">Ainda não há checkpoints de final de tratamento, 3, 6 ou 12 meses registrados.</p>}</article>
      </section>
      <section className="notice"><strong>Duas informações complementares, sem inferência automática</strong><span>A avaliação persistente por domínio vem das escalas registradas no Prontuário; o mapa de recuperação permanece uma avaliação clínica explícita do profissional. O sistema não converte uma delas automaticamente na outra e não altera tratamento oncológico.</span></section>
    </main>
  );
}