import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { prisma } from "@/server/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthenticatedUser("patient.read");
    const { id } = await context.params;
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      select: { id: true, patientId: true, status: true },
    });
    if (!consultation) {
      return NextResponse.json({ code: "CONSULTATION_NOT_FOUND", message: "Consulta não encontrada." }, { status: 404 });
    }

    const assessments = await prisma.scaleAssessment.findMany({
      where: { consultationId: consultation.id, patientId: consultation.patientId },
      orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        scaleCode: true,
        scaleVersion: true,
        scoreNumeric: true,
        scoreText: true,
        classification: true,
        interpretation: true,
        clinicalColor: true,
        appliedAt: true,
      },
    });

    const latestByCode = new Map<string, (typeof assessments)[number]>();
    for (const assessment of assessments) {
      if (!latestByCode.has(assessment.scaleCode)) latestByCode.set(assessment.scaleCode, assessment);
    }

    return NextResponse.json({
      consultationId: consultation.id,
      consultationStatus: consultation.status,
      latest: [...latestByCode.values()].map((assessment) => ({
        ...assessment,
        scoreNumeric: assessment.scoreNumeric === null ? null : Number(assessment.scoreNumeric),
        appliedAt: assessment.appliedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({
      code: "CLINICAL_SCALE_STATUS_FAILED",
      message: "Não foi possível carregar o estado das escalas desta consulta.",
    }, { status: 500 });
  }
}
