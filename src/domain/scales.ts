export interface ScaleAssessment<TAnswers = Record<string, unknown>> {
  patientId: string;
  consultationId: string;
  scaleCode: string;
  scaleVersion: string;
  answers: TAnswers;
  scoreNumeric?: number;
  scoreText?: string;
  classification?: string;
  interpretation?: string;
  appliedAt: Date;
}

export interface TrendPoint {
  date: Date;
  score: number;
}

export function chronologicalTrend(points: TrendPoint[]): TrendPoint[] {
  return [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Não misturar versões/instrumentos silenciosamente.
 * A UI deve chamar esta função antes de montar uma série temporal.
 */
export function assertComparableSeries(
  assessments: Pick<ScaleAssessment, "scaleCode" | "scaleVersion">[],
) {
  const keys = new Set(
    assessments.map((a) => `${a.scaleCode}::${a.scaleVersion}`),
  );

  if (keys.size > 1) {
    throw new Error(
      "A série contém instrumentos ou versões diferentes e não pode ser comparada diretamente.",
    );
  }
}
