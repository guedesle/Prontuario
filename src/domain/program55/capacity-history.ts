import {
  buildCapacityDimensionHistory,
  type CapacityDimensionHistory,
  type CapacityTimelineAssessment,
  type CapacityTimelineConsultation,
  type CapacityTimelineMilestone,
} from "../capacity-dimension-history.ts";

export interface Program55LinkedCheckpoint {
  coordinatingConsultationId?: string | null;
}

export function program55LinkedConsultationIds(checkpoints: readonly Program55LinkedCheckpoint[]): string[] {
  return [...new Set(checkpoints.flatMap((checkpoint) => checkpoint.coordinatingConsultationId ? [checkpoint.coordinatingConsultationId] : []))];
}

/** Restringe a trajetória 55+ às consultas explicitamente ligadas ao ciclo. */
export function buildProgram55CapacityHistory(input: {
  patientId: string;
  checkpoints: readonly Program55LinkedCheckpoint[];
  consultations: readonly CapacityTimelineConsultation[];
  assessments: readonly CapacityTimelineAssessment[];
  milestones?: readonly CapacityTimelineMilestone[];
}): CapacityDimensionHistory {
  const linkedIds = new Set(program55LinkedConsultationIds(input.checkpoints));
  const consultations = input.consultations.filter((consultation) => linkedIds.has(consultation.id));
  const assessments = input.assessments.filter((assessment) => linkedIds.has(assessment.consultationId));
  const milestones = (input.milestones ?? []).filter((milestone) => linkedIds.has(milestone.consultationId));
  const latestConsultationId = [...consultations]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())[0]?.id;

  return buildCapacityDimensionHistory({
    patientId: input.patientId,
    consultations,
    assessments,
    milestones,
    targetConsultationId: latestConsultationId,
    includeTargetWhenEmpty: false,
  });
}
