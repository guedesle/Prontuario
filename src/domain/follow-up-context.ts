import type { ClinicalProblem } from "./problems.ts";
import { activeProblems } from "./problems.ts";
import type { LongitudinalAssessment } from "./clinical-change-summary.ts";
import { buildClinicalChangeSummary } from "./clinical-change-summary.ts";
import { proposeProblemsFromAssessments } from "./problem-proposals.ts";

export interface FollowUpContext {
  patientId: string;
  inheritedProblems: ClinicalProblem[];
  changeSummary: ReturnType<typeof buildClinicalChangeSummary>;
  proposedProblems: ReturnType<typeof proposeProblemsFromAssessments>;
}

export function buildFollowUpContext(input: {
  patientId: string;
  longitudinalAssessments: readonly LongitudinalAssessment[];
  longitudinalProblems: readonly ClinicalProblem[];
}): FollowUpContext {
  const wrongPatientAssessment = input.longitudinalAssessments.find((item) => item.patientId !== input.patientId);
  if (wrongPatientAssessment) {
    throw new Error("Avaliação de outro paciente detectada no contexto da consulta subsequente.");
  }
  const wrongPatientProblem = input.longitudinalProblems.find((item) => item.patientId !== input.patientId);
  if (wrongPatientProblem) {
    throw new Error("Problema de outro paciente detectado no contexto da consulta subsequente.");
  }

  const changeSummary = buildClinicalChangeSummary(input.longitudinalAssessments);
  const currentByScale = new Map<string, LongitudinalAssessment>();
  for (const assessment of input.longitudinalAssessments) {
    const existing = currentByScale.get(assessment.scaleCode);
    if (!existing || new Date(assessment.appliedAt).getTime() > new Date(existing.appliedAt).getTime()) {
      currentByScale.set(assessment.scaleCode, assessment);
    }
  }

  return {
    patientId: input.patientId,
    inheritedProblems: activeProblems([...input.longitudinalProblems]),
    changeSummary,
    proposedProblems: proposeProblemsFromAssessments([...currentByScale.values()]),
  };
}
