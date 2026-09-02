import { RecoveryForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

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
  const followUps = workspace.checkpoints.filter((item) => item.type === "END_OF_TREATMENT" || item.type.startsWith("POST_"));
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · transição</p><h1>Pós-tratamento e recuperação</h1><p>{patient.fullName}. Compare o estado final com o baseline e registre a recuperação por domínio sob julgamento profissional.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Mapa de recuperação</h2><RecoveryForm patientId={patientId} episodeId={episode.id} /></article>
        <article className="panel"><h2>Situação por domínio</h2>{workspace.recovery.length ? <ul className="clean-list">{workspace.recovery.map((item) => <li key={item.id}><strong>{item.domain} · {labels[item.status] ?? item.status}</strong><span>{formatClinicalDate(item.assessedAt)}{item.notes ? ` · ${item.notes}` : ""}</span></li>)}</ul> : <p className="muted">Nenhum domínio de recuperação avaliado.</p>}</article>
      </section>
      <section className="panel"><h2>Checkpoints de transição/seguimento</h2>{followUps.length ? <ul className="clean-list">{followUps.map((item) => <li key={item.id}><strong>{item.type}</strong><span>realizado: {formatClinicalDate(item.occurredAt)} · previsto: {formatClinicalDate(item.scheduledAt)} · {item.status}</span></li>)}</ul> : <p className="muted">Ainda não há checkpoints de final de tratamento, 3, 6 ou 12 meses registrados. O sistema não cria consultas automaticamente.</p>}</section>
    </main>
  );
}
