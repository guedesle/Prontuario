import { BaselineCheckpointForm, G8Form } from "@/components/oncogeriatria/oncogeriatric-forms";
import { OncogeriatricNav } from "@/components/oncogeriatria/oncogeriatric-nav";
import { formatClinicalDate, loadEpisodeWorkspace, loadOncogeriatricPatient, requireOncogeriatricReadAccess, resolveOncogeriatricEpisode } from "@/server/oncogeriatria/read";

export default async function OncogeriatricBaselinePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ episode?: string }> }) {
  await requireOncogeriatricReadAccess();
  const { id: patientId } = await params;
  const query = await searchParams;
  const patient = await loadOncogeriatricPatient(patientId);
  const episode = await resolveOncogeriatricEpisode(patientId, query.episode);
  if (!episode) return <main className="shell"><p>Inicie um episódio oncogeriátrico no resumo do paciente.</p></main>;
  const workspace = await loadEpisodeWorkspace(patientId, episode.id);
  const baselines = workspace.checkpoints.filter((item) => item.type === "PRE_TREATMENT");
  const current = baselines[baselines.length - 1];
  const consultationOptions = workspace.consultations.map((item) => ({ id: item.id, label: `${formatClinicalDate(item.occurredAt)} · ${item.status}` }));
  const courseOptions = workspace.courses.map((item) => ({ id: item.id, label: `${item.regimenName} · ${item.status}` }));

  return (
    <main className="shell">
      <header className="hero compact-hero"><p className="eyebrow">Oncogeriatria · basal</p><h1>Avaliação pré-tratamento</h1><p>{patient.fullName} · {episode.diagnosis}. O baseline deve registrar o estado geriátrico antes do tratamento sem obrigar preenchimento indiscriminado de todas as escalas.</p></header>
      <OncogeriatricNav patientId={patientId} episodeId={episode.id} />
      <section className="two-columns">
        <article className="panel"><h2>Novo baseline</h2><BaselineCheckpointForm patientId={patientId} episodeId={episode.id} consultations={consultationOptions} courses={courseOptions} /></article>
        <article className="panel"><h2>Histórico basal</h2>{baselines.length ? <ul className="clean-list">{baselines.map((item) => <li key={item.id}><strong>{formatClinicalDate(item.occurredAt)}</strong><span>{item.status} · {item.consultationId ? "vinculado à consulta" : "sem consulta vinculada"}</span></li>)}</ul> : <p className="muted">Ainda não há baseline registrado.</p>}</article>
      </section>
      {current ? <section className="two-columns">
        <article className="panel">{current.consultationId ? <G8Form patientId={patientId} episodeId={episode.id} checkpointId={current.id} /> : <p className="clinical-caution">Para persistir G8 no motor único de escalas, o checkpoint precisa estar vinculado a uma consulta existente. O sistema não cria consulta artificialmente.</p>}</article>
        <article className="panel"><h3>CARG — implementação bloqueada nesta release</h3><p className="clinical-caution">A ferramenta CARG-TT possui copyright explicitamente atribuído ao Cancer and Aging Research Group. A implementação eletrônica local permanece indisponível até resolução formal das condições de uso/licenciamento. O restante do módulo funciona normalmente.</p><p className="muted">Nenhuma PHI é enviada ao site ou à calculadora externa.</p></article>
      </section> : null}
    </main>
  );
}
