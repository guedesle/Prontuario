export interface PreviousScaleAssessmentRecord {
  id: string;
  patientId: string;
  consultationId: string;
  scaleCode: string;
  scaleVersion: string;
  scoreNumeric?: number | null;
  scoreText?: string | null;
  classification?: string | null;
  appliedAt: Date | string;
}

function timestamp(value: Date | string): number {
  const result = new Date(value).getTime();
  if (!Number.isFinite(result)) throw new Error("Data inválida no histórico de escalas.");
  return result;
}

/**
 * Seleciona o último registro anterior de cada instrumento dentro do horizonte
 * explícito da consulta. A consulta atual é sempre excluída: o resultado serve
 * apenas como lembrete longitudinal e nunca pré-seleciona uma escala.
 */
export function latestPreviousScaleAssessments<T extends PreviousScaleAssessmentRecord>(input: {
  patientId: string;
  targetConsultationId: string;
  consultationIds: readonly string[];
  assessments: readonly T[];
}): T[] {
  const targetIndex = input.consultationIds.indexOf(input.targetConsultationId);
  if (targetIndex < 0) throw new Error("Consulta atual ausente do horizonte de escalas.");
  if (input.assessments.some((assessment) => assessment.patientId !== input.patientId)) {
    throw new Error("Histórico de escalas não pode misturar pacientes diferentes.");
  }

  const order = new Map(input.consultationIds.slice(0, targetIndex).map((id, index) => [id, index]));
  const latest = new Map<string, T>();

  for (const assessment of input.assessments) {
    const assessmentOrder = order.get(assessment.consultationId);
    if (assessmentOrder === undefined) continue;
    const previous = latest.get(assessment.scaleCode);
    if (!previous) {
      latest.set(assessment.scaleCode, assessment);
      continue;
    }
    const previousOrder = order.get(previous.consultationId)!;
    if (
      assessmentOrder > previousOrder
      || (assessmentOrder === previousOrder && timestamp(assessment.appliedAt) > timestamp(previous.appliedAt))
      || (assessmentOrder === previousOrder && timestamp(assessment.appliedAt) === timestamp(previous.appliedAt) && assessment.id.localeCompare(previous.id) > 0)
    ) {
      latest.set(assessment.scaleCode, assessment);
    }
  }

  return [...latest.values()].sort((left, right) => left.scaleCode.localeCompare(right.scaleCode));
}
