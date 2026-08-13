import type { ClinicalProblem } from "./problems.ts";
import type { LongitudinalAssessment } from "./clinical-change-summary.ts";
import type { MedicationPlanItem } from "./medication-plan.ts";

export const DEMO_PATIENT = {
  id: "demo-patient-001",
  name: "Paciente Demonstração",
};

export const DEMO_PROBLEMS: ClinicalProblem[] = [
  { id: "demo-problem-1", patientId: DEMO_PATIENT.id, type: "CLINICAL", status: "ACTIVE", title: "Hipertensão arterial", priority: 1 },
  { id: "demo-problem-2", patientId: DEMO_PATIENT.id, type: "GERIATRIC", status: "ACTIVE", title: "Dependência para atividades instrumentais", priority: 2 },
];

export const DEMO_ASSESSMENTS: LongitudinalAssessment[] = [
  { patientId: DEMO_PATIENT.id, consultationId: "demo-aga", scaleCode: "lawton", scaleVersion: "legacy-1", score: 20, scoreText: "20", color: "amarelo", classification: "Dependência parcial", appliedAt: "2026-01-10", isBaseline: true },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-1", scaleCode: "lawton", scaleVersion: "legacy-1", score: 18, scoreText: "18", color: "amarelo", classification: "Dependência parcial", appliedAt: "2026-04-10" },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-2", scaleCode: "lawton", scaleVersion: "legacy-1", score: 15, scoreText: "15", color: "amarelo", classification: "Dependência parcial", appliedAt: "2026-08-10" },

  { patientId: DEMO_PATIENT.id, consultationId: "demo-aga", scaleCode: "barthel", scaleVersion: "legacy-1", score: 90, scoreText: "90", color: "amarelo", classification: "Dependência leve", appliedAt: "2026-01-10", isBaseline: true },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-1", scaleCode: "barthel", scaleVersion: "legacy-1", score: 85, scoreText: "85", color: "amarelo", classification: "Dependência leve", appliedAt: "2026-04-10" },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-2", scaleCode: "barthel", scaleVersion: "legacy-1", score: 65, scoreText: "65", color: "amarelo", classification: "Dependência leve", appliedAt: "2026-08-10" },

  { patientId: DEMO_PATIENT.id, consultationId: "demo-aga", scaleCode: "gds15", scaleVersion: "legacy-1", score: 8, scoreText: "8", color: "amarelo", classification: "Sintomas depressivos leves", appliedAt: "2026-01-10", isBaseline: true },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-1", scaleCode: "gds15", scaleVersion: "legacy-1", score: 5, scoreText: "5", color: "verde", classification: "Sem sintomas relevantes", appliedAt: "2026-04-10" },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-2", scaleCode: "gds15", scaleVersion: "legacy-1", score: 3, scoreText: "3", color: "verde", classification: "Sem sintomas relevantes", appliedAt: "2026-08-10" },

  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-2", scaleCode: "sarcf", scaleVersion: "legacy-1", score: 5, scoreText: "5", color: "vermelho", classification: "Rastreio positivo", appliedAt: "2026-08-10" },
  { patientId: DEMO_PATIENT.id, consultationId: "demo-follow-2", scaleCode: "mna_sf", scaleVersion: "legacy-1", score: 9, scoreText: "9", color: "amarelo", classification: "Risco de desnutrição", appliedAt: "2026-08-10" },
];

export const DEMO_MEDICATIONS: MedicationPlanItem[] = [
  { id: "demo-med-1", name: "Medicamento A", presentation: "50 mg", dose: "1 comprimido", route: "VO", moment: "manha", continuous: true },
  { id: "demo-med-2", name: "Medicamento B", presentation: "5 mg", dose: "1 comprimido", route: "VO", moment: "noite", continuous: true },
];
