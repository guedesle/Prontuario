export type ConsultationStatus = "DRAFT" | "IN_REVIEW" | "FINALIZED";

const ALLOWED: Readonly<Record<ConsultationStatus, ReadonlySet<ConsultationStatus>>> = {
  DRAFT: new Set(["IN_REVIEW"]),
  IN_REVIEW: new Set(["DRAFT", "FINALIZED"]),
  FINALIZED: new Set(),
};

export function assertConsultationTransition(from: ConsultationStatus, to: ConsultationStatus): void {
  if (!ALLOWED[from].has(to)) {
    throw new Error(`Transição de consulta não permitida: ${from} → ${to}.`);
  }
}

export interface FinalizationGateInput {
  selectedPatientId: string;
  consultationPatientId: string;
  selectedConsultationId: string;
  consultationId: string;
  status: ConsultationStatus;
  clinicalReviewConfirmed: boolean;
  unresolvedUrgentAlerts: readonly string[];
}

export function assertConsultationCanFinalize(input: FinalizationGateInput): void {
  if (input.selectedPatientId !== input.consultationPatientId) {
    throw new Error("Paciente selecionado diverge da consulta.");
  }
  if (input.selectedConsultationId !== input.consultationId) {
    throw new Error("Consulta selecionada diverge do contexto de finalização.");
  }
  if (input.status !== "IN_REVIEW") {
    throw new Error("A consulta precisa estar em revisão antes da finalização.");
  }
  if (!input.clinicalReviewConfirmed) {
    throw new Error("Revisão clínica final não confirmada.");
  }
  if (input.unresolvedUrgentAlerts.length > 0) {
    throw new Error("Existem alertas clínicos urgentes ainda não revisados.");
  }
}

export function assertConsultationEditable(status: ConsultationStatus): void {
  if (status === "FINALIZED") {
    throw new Error("Consulta finalizada é imutável; registre nova consulta ou adendo versionado.");
  }
}
