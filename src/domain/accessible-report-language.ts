import type { AgaReportConsultationStatus } from "./aga-report.ts";
import type { ProblemStatus, ProblemType } from "./problems.ts";
import type { SourceValidationStatus } from "./clinical-config/source-provenance.ts";

const CONSULTATION_STATUS_LABELS: Record<AgaReportConsultationStatus, string> = {
  DRAFT: "Em preenchimento",
  IN_REVIEW: "Em revisão",
  FINALIZED: "Finalizada",
};

const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  ACTIVE: "Ativo",
  STABLE: "Estável",
  MONITORING: "Em acompanhamento",
  RESOLVED: "Resolvido",
};

const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  CLINICAL: "Clínico",
  GERIATRIC: "Geriátrico",
};

const SOURCE_STATUS_LABELS: Record<SourceValidationStatus, string> = {
  "confirmed-primary": "Fonte principal confirmada",
  "mixed-primary-and-local": "Fonte principal com adaptação local identificada",
  "confirmed-institutional": "Fonte institucional confirmada",
  "needs-review": "Fonte em revisão",
};

export function consultationStatusLabel(status: AgaReportConsultationStatus): string {
  return CONSULTATION_STATUS_LABELS[status];
}

export function problemStatusLabel(status: ProblemStatus): string {
  return PROBLEM_STATUS_LABELS[status];
}

export function problemTypeLabel(type: ProblemType): string {
  return PROBLEM_TYPE_LABELS[type];
}

export function sourceStatusLabel(status: string): string {
  return SOURCE_STATUS_LABELS[status as SourceValidationStatus] ?? "Fonte em revisão";
}

export function alertSeverityLabel(severity: string): string {
  if (severity === "urgent") return "Urgente";
  if (severity === "attention") return "Atenção";
  return "Atenção";
}
