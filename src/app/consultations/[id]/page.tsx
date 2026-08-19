import { notFound } from "next/navigation";
import { ConsultationFinalizationPanel } from "@/components/consultations/consultation-finalization-panel";
import { AgaReportPreview } from "@/components/reports/aga-report-preview";
import { OncogeriatricScales } from "@/components/scales/oncogeriatric-scales";
import { buildConsultationContextViewModel } from "@/domain/consultation-context";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuthenticatedUser("patient.read");
  const { id } = await params;
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      occurredAt: true,
      patient: {
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          needsIdentityReview: true,
        },
      },
    },
  });

  if (!consultation) notFound();

  const context = buildConsultationContextViewModel({
    consultationId: consultation.id,
    type: consultation.type,
    status: consultation.status,
    occurredAt: consultation.occurredAt,
    patient: consultation.patient,
  });

  return (
    <main className="shell consultation-shell">
      <header className="hero compact-hero clinical-hero">
        <p className="eyebrow">Consulta geriátrica longitudinal</p>
        <div className="consultation-identity-heading">
          <div>
            <h1>{context.patientName}</h1>
            <p className="consultation-context-subtitle">Centro de cuidado e evolução</p>
          </div>
          <span className="consultation-status-badge" data-status={consultation.status}>
            {context.consultationStatusLabel}
          </span>
        </div>

        <dl className="consultation-context-grid" aria-label="Identificação da consulta atual">
          <div>
            <dt>Data de nascimento</dt>
            <dd>{context.patientBirthDateLabel}</dd>
          </div>
          <div>
            <dt>Tipo de consulta</dt>
            <dd>{context.consultationTypeLabel}</dd>
          </div>
          <div>
            <dt>Data da consulta</dt>
            <dd>{context.consultationDateLabel}</dd>
          </div>
        </dl>

        {context.needsIdentityReview ? (
          <div className="consultation-identity-warning" role="alert">
            <strong>Identidade/homônimo pendente de revisão</strong>
            <span>Confirme a identidade no cadastro do paciente antes de emitir ou compartilhar documentos.</span>
          </div>
        ) : null}

        <a className="consultation-patient-link" href={`/patients/${context.patientId}`}>
          Voltar ao cadastro do paciente
        </a>

        <p className="consultation-context-intro">
          Registre avaliações, acompanhe mudanças desde a AGA inicial e gere um relatório
          compartilhável após revisão clínica.
        </p>
        <ol className="workflow-steps" aria-label="Etapas da consulta">
          <li><span>1</span>Avaliar</li>
          <li><span>2</span>Comparar</li>
          <li><span>3</span>Revisar</li>
          <li><span>4</span>Compartilhar</li>
        </ol>
      </header>

      <OncogeriatricScales consultationId={id} />

      <AgaReportPreview consultationId={id} />

      <ConsultationFinalizationPanel consultationId={id} />
    </main>
  );
}
