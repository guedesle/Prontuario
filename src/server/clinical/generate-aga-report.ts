import type { Prisma } from "../../generated/prisma/client";
import { buildAgaReportModel, renderAgaReportText } from "../../domain/aga-report";
import type { LongitudinalAssessment } from "../../domain/clinical-change-summary";
import type { ClinicalProblem } from "../../domain/problems";
import { prisma } from "../db";
import { requireAuthenticatedUser } from "../auth/require-user";
import { createDocumentSnapshot } from "./persistence";

function answersRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function generateAgaReport(input: {
  consultationId: string;
  requestId?: string;
}) {
  await requireAuthenticatedUser("document.generate");
  const consultation = await prisma.consultation.findUnique({
    where: { id: input.consultationId },
    select: {
      id: true,
      patientId: true,
      status: true,
      patient: {
        select: {
          fullName: true,
          baselineConsultationId: true,
          problems: {
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              patientId: true,
              type: true,
              status: true,
              title: true,
              description: true,
              priority: true,
            },
          },
          scaleAssessments: {
            orderBy: { appliedAt: "asc" },
            select: {
              patientId: true,
              consultationId: true,
              scaleCode: true,
              scaleVersion: true,
              answers: true,
              scoreNumeric: true,
              scoreText: true,
              classification: true,
              interpretation: true,
              clinicalColor: true,
              appliedAt: true,
            },
          },
        },
      },
    },
  });
  if (!consultation) throw new Error("Consulta não encontrada.");

  const assessments: LongitudinalAssessment[] = consultation.patient.scaleAssessments.map((assessment) => ({
    patientId: assessment.patientId,
    consultationId: assessment.consultationId,
    scaleCode: assessment.scaleCode,
    scaleVersion: assessment.scaleVersion,
    score: assessment.scoreNumeric === null ? null : Number(assessment.scoreNumeric),
    scoreText: assessment.scoreText ?? undefined,
    classification: assessment.classification ?? undefined,
    interpretation: assessment.interpretation ?? undefined,
    color: (assessment.clinicalColor ?? undefined) as LongitudinalAssessment["color"],
    answers: answersRecord(assessment.answers),
    appliedAt: assessment.appliedAt,
    isBaseline: assessment.consultationId === consultation.patient.baselineConsultationId,
  }));

  const report = buildAgaReportModel({
    patientId: consultation.patientId,
    consultationId: consultation.id,
    consultationStatus: consultation.status,
    patientName: consultation.patient.fullName,
    longitudinalAssessments: assessments,
    longitudinalProblems: consultation.patient.problems as ClinicalProblem[],
  });
  const text = renderAgaReportText(report);
  const snapshot = await createDocumentSnapshot({
    consultationId: consultation.id,
    type: "AGA_REPORT",
    contentSchemaVersion: report.schemaVersion,
    content: { report, text } as unknown as Prisma.InputJsonValue,
    requestId: input.requestId,
  });

  return { report, text, snapshot };
}
