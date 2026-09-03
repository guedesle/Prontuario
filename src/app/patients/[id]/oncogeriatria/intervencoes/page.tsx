import { InterventionForm } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

const domainLabels: Record<string, string> = {
  NUTRITION: "Nutrição", MOBILITY: "Mobilidade", SARCOPENIA: "Sarcopenia", FALLS: "Quedas", COGNITION: "Cognição",
  MEDICATIONS: "Medicamentos", MOOD: "Humor", SYMPTOMS: "Sintomas", SOCIAL: "Suporte social", HEARING: "Audição", OTHER: "Outros",
};

export default async function OncogeriatricInterventionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico antes de registrar intervenções.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · pré-habilitação</p><h1>Vulnerabilidades e intervenções</h1><p>{patient.fullName}. Registre vulnerabilidades, intervenção revisada, responsável e resultado; o sistema não gera conduta clínica automaticamente.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Nova intervenção</h2><InterventionForm patientId={patientId} episodeId={episode.id} /></article>
        <article className="panel"><h2>Plano em andamento</h2>{workspace.interventions.length ? <ul className="clean-list">{workspace.interventions.map((item) => <li key={item.id}><strong>{domainLabels[item.domain] ?? item.domain} · {item.status}</strong><span>{item.description}{item.intervention ? ` · intervenção: ${item.intervention}` : ""}{item.responsibleProfessional ? ` · responsável: ${item.responsibleProfessional}` : ""}{item.dueAt ? ` · prevista: ${formatClinicalDate(item.dueAt)}` : ""}{item.result ? ` · resultado: ${item.result}` : ""}</span></li>)}</ul> : <p className="muted">Nenhuma intervenção registrada.</p>}</article>
      </section>
    </main>
  );
}
