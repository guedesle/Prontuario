export type ConsultationContextType = "AGA_INITIAL" | "FOLLOW_UP";
export type ConsultationContextStatus = "DRAFT" | "IN_REVIEW" | "FINALIZED";

export const CONSULTATION_TYPE_LABELS: Readonly<Record<ConsultationContextType, string>> = {
  AGA_INITIAL: "AGA inicial",
  FOLLOW_UP: "Consulta subsequente",
};

export const CONSULTATION_STATUS_LABELS: Readonly<Record<ConsultationContextStatus, string>> = {
  DRAFT: "Rascunho",
  IN_REVIEW: "Em revisão",
  FINALIZED: "Finalizada",
};

function cleanSingleLine(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function formatClinicalDate(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export interface ConsultationContextInput {
  consultationId: string;
  type: ConsultationContextType;
  status: ConsultationContextStatus;
  occurredAt: Date;
  patient: {
    id: string;
    fullName: string;
    birthDate: Date | null;
    needsIdentityReview: boolean;
  };
}

export interface ConsultationContextViewModel {
  consultationId: string;
  patientId: string;
  patientName: string;
  patientBirthDateLabel: string;
  consultationTypeLabel: string;
  consultationDateLabel: string;
  consultationStatusLabel: string;
  needsIdentityReview: boolean;
}

export function buildConsultationContextViewModel(
  input: ConsultationContextInput,
): ConsultationContextViewModel {
  const consultationId = input.consultationId.trim();
  const patientId = input.patient.id.trim();
  const patientName = cleanSingleLine(input.patient.fullName);

  if (!consultationId) throw new Error("Consulta sem identificador persistido.");
  if (!patientId) throw new Error("Consulta sem paciente vinculado.");
  if (!patientName) throw new Error("Consulta sem paciente identificado.");

  return {
    consultationId,
    patientId,
    patientName,
    patientBirthDateLabel: input.patient.birthDate
      ? formatClinicalDate(input.patient.birthDate)
      : "não registrada",
    consultationTypeLabel: CONSULTATION_TYPE_LABELS[input.type],
    consultationDateLabel: formatClinicalDate(input.occurredAt),
    consultationStatusLabel: CONSULTATION_STATUS_LABELS[input.status],
    needsIdentityReview: input.patient.needsIdentityReview,
  };
}
