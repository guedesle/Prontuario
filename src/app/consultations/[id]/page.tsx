import { AgaReportPreview } from "@/components/reports/aga-report-preview";
import { OncogeriatricScales } from "@/components/scales/oncogeriatric-scales";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="shell">
      <header className="hero compact-hero">
        <p className="eyebrow">Consulta geriátrica</p>
        <h1>Relatório e encerramento</h1>
        <p>Emissão documental e finalização são ações independentes.</p>
      </header>
      <OncogeriatricScales consultationId={id} />
      <AgaReportPreview consultationId={id} />
      <section className="finalization-panel no-print">
        <h2>Finalizar consulta</h2>
        <p>A finalização continua sujeita à revisão clínica e aos alertas urgentes. Ela não é necessária para emitir o relatório.</p>
      </section>
    </main>
  );
}
