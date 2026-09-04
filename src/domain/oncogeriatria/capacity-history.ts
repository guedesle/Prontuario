import {
  buildCapacityDimensionHistory,
  type CapacityDimensionHistory,
  type CapacityDimensionStatus,
  type CapacityTimelineAssessment,
  type CapacityTimelineConsultation,
  type CapacityTimelineMilestone,
} from "../capacity-dimension-history.ts";

export const ONCOGERIATRIC_DOMAIN_STATUS_LABEL: Record<CapacityDimensionStatus, string> = {
  "not-assessed": "Não avaliado",
  recorded: "Registrado sem estado categórico",
  indeterminate: "Indeterminado / discordante",
  preserved: "Sem redução detectada",
  attention: "Sinal de atenção",
  altered: "Redução identificada",
};

export interface OncogeriatricLinkedCheckpoint {
  consultationId?: string | null;
}

export interface OncogeriatricCapacityConsultation {
  id: string;
  patientId: string;
  occurredAt: Date | string;
  createdAt?: Date | string;
}

export interface OncogeriatricCapacityAssessment {
  id?: string;
  patientId: string;
  consultationId: string;
  scaleCode: string;
  scaleVersion?: string | null;
  scoreNumeric?: unknown;
  scoreText?: string | null;
  classification?: string | null;
  interpretation?: string | null;
  clinicalColor?: string | null;
  appliedAt: Date | string;
  sourceCitation?: string | null;
  definitionHash?: string | null;
}

function numericScore(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Reutiliza o mesmo motor metodológico do Prontuário Aprimorado, mas restringe
 * a linha oncogeriátrica às consultas explicitamente vinculadas a checkpoints
 * deste episódio. Assim, uma consulta geriátrica não é incorporada ao episódio
 * oncológico sem decisão médica explícita.
 */
export function buildOncogeriatricCapacityHistory(input: {
  patientId: string;
  checkpoints: readonly OncogeriatricLinkedCheckpoint[];
  consultations: readonly OncogeriatricCapacityConsultation[];
  assessments: readonly OncogeriatricCapacityAssessment[];
  milestones?: readonly CapacityTimelineMilestone[];
}): CapacityDimensionHistory {
  const linkedConsultationIds = new Set(
    input.checkpoints.flatMap((checkpoint) => checkpoint.consultationId ? [checkpoint.consultationId] : []),
  );

  const consultations: CapacityTimelineConsultation[] = input.consultations
    .filter((consultation) => linkedConsultationIds.has(consultation.id))
    .map((consultation) => ({
      id: consultation.id,
      patientId: consultation.patientId,
      occurredAt: consultation.occurredAt,
      createdAt: consultation.createdAt,
    }));

  const assessments: CapacityTimelineAssessment[] = input.assessments
    .filter((assessment) => linkedConsultationIds.has(assessment.consultationId))
    .map((assessment) => ({
      id: assessment.id,
      patientId: assessment.patientId,
      consultationId: assessment.consultationId,
      scaleCode: assessment.scaleCode,
      scaleVersion: assessment.scaleVersion,
      scoreNumeric: numericScore(assessment.scoreNumeric),
      scoreText: assessment.scoreText,
      classification: assessment.classification,
      interpretation: assessment.interpretation,
      clinicalColor: assessment.clinicalColor as CapacityTimelineAssessment["clinicalColor"],
      appliedAt: assessment.appliedAt,
      sourceCitation: assessment.sourceCitation,
      definitionHash: assessment.definitionHash,
    }));

  const latestConsultationId = [...consultations]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())[0]?.id;

  return buildCapacityDimensionHistory({
    patientId: input.patientId,
    consultations,
    assessments,
    milestones: (input.milestones ?? []).filter((milestone) => linkedConsultationIds.has(milestone.consultationId)),
    targetConsultationId: latestConsultationId,
    includeTargetWhenEmpty: false,
  });
}

export interface OncogeriatricLatestDomainState {
  code: string;
  label: string;
  status: CapacityDimensionStatus;
  statusLabel: string;
  occurredAt: string | null;
  statusReason: string;
  instruments: Array<{
    code: string;
    name: string;
    version: string;
    score: string | null;
    classification: string | null;
    selectedForDomainState: boolean;
  }>;
}

/**
 * Mantém o último estado efetivamente avaliado de cada domínio. Uma consulta
 * posterior sem reaplicação não transforma o domínio em "não avaliado" nem
 * apaga o registro anterior; a ausência continua explícita apenas naquele
 * checkpoint no gráfico longitudinal.
 */
export function latestOncogeriatricDomainStates(
  history: CapacityDimensionHistory,
): OncogeriatricLatestDomainState[] {
  const dateByConsultation = new Map(history.consultations.map((consultation) => [consultation.id, consultation.occurredAt]));

  return history.dimensions.map((dimension) => {
    const latestRecorded = [...dimension.cells].reverse().find((cell) => cell.assessments.length > 0);
    if (!latestRecorded) {
      return {
        code: dimension.code,
        label: dimension.label,
        status: "not-assessed" as const,
        statusLabel: ONCOGERIATRIC_DOMAIN_STATUS_LABEL["not-assessed"],
        occurredAt: null,
        statusReason: "Nenhuma avaliação metodologicamente mapeada foi vinculada a um checkpoint deste episódio.",
        instruments: [],
      };
    }

    return {
      code: dimension.code,
      label: dimension.label,
      status: latestRecorded.status,
      statusLabel: ONCOGERIATRIC_DOMAIN_STATUS_LABEL[latestRecorded.status],
      occurredAt: dateByConsultation.get(latestRecorded.consultationId) ?? null,
      statusReason: latestRecorded.statusReason,
      instruments: latestRecorded.assessments.map((assessment) => ({
        code: assessment.scaleCode,
        name: assessment.scaleName,
        version: assessment.scaleVersion,
        score: assessment.scoreText ?? (assessment.scoreNumeric === null || assessment.scoreNumeric === undefined ? null : String(assessment.scoreNumeric)),
        classification: assessment.classification ?? null,
        selectedForDomainState: assessment.selectedForDomainState,
      })),
    };
  });
}
