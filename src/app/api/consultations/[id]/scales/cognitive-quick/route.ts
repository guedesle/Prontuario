import { NextResponse } from "next/server";
import {
  COGNITIVE_QUICK_DEFINITIONS,
  scoreCognitiveQuickEntry,
  type CognitiveQuickCode,
} from "@/domain/cognitive-quick-entry";
import { scaleConsultationHorizonIds } from "@/domain/scale-consultation-horizon";
import { requireAuthenticatedUser } from "@/server/auth/require-user";
import { saveScaleAssessment } from "@/server/clinical/persistence";
import { prisma } from "@/server/db";

const SUPPORTED = new Set<CognitiveQuickCode>(COGNITIVE_QUICK_DEFINITIONS.map((item) => item.code));

async function consultationContext(consultationId: string) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { id: true, patientId: true, status: true },
  });
  if (!consultation) throw new Error("CONSULTATION_NOT_FOUND");
  return consultation;
}

function parseBody(value: unknown): { scaleCode: CognitiveQuickCode; answers: Record<string, unknown> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("INVALID_REQUEST");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => key !== "scaleCode" && key !== "answers")) throw new Error("INVALID_REQUEST");
  if (typeof body.scaleCode !== "string" || !SUPPORTED.has(body.scaleCode as CognitiveQuickCode)) throw new Error("INVALID_REQUEST");
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) throw new Error("INVALID_REQUEST");
  return { scaleCode: body.scaleCode as CognitiveQuickCode, answers: body.answers as Record<string, unknown> };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  if (message === "CONSULTATION_NOT_FOUND") return NextResponse.json({ code: message, message: "Consulta não encontrada." }, { status: 404 });
  if (message === "INVALID_REQUEST" || /inválido|não permitido|não disponível/i.test(message)) {
    return NextResponse.json({ code: "INVALID_COGNITIVE_QUICK_ENTRY", message: "Registro cognitivo rápido inválido." }, { status: 400 });
  }
  return NextResponse.json({ code: "COGNITIVE_QUICK_ENTRY_FAILED", message: "Não foi possível processar o registro cognitivo rápido." }, { status: 500 });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthenticatedUser("patient.read");
    const { id } = await context.params;
    const consultation = await consultationContext(id);
    const consultations = await prisma.consultation.findMany({
      where: { patientId: consultation.patientId },
      select: { id: true, patientId: true, occurredAt: true, createdAt: true },
    });
    const consultationIds = scaleConsultationHorizonIds({
      patientId: consultation.patientId,
      targetConsultationId: consultation.id,
      consultations,
    });
    const codes = COGNITIVE_QUICK_DEFINITIONS.map((item) => item.code);
    const assessments = await prisma.scaleAssessment.findMany({
      where: {
        patientId: consultation.patientId,
        consultationId: { in: consultationIds },
        scaleCode: { in: codes },
      },
      orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        consultationId: true,
        scaleCode: true,
        scaleVersion: true,
        scoreNumeric: true,
        scoreText: true,
        classification: true,
        interpretation: true,
        appliedAt: true,
      },
    });
    return NextResponse.json({
      consultationId: consultation.id,
      consultationStatus: consultation.status,
      definitions: COGNITIVE_QUICK_DEFINITIONS,
      latest: codes.map((scaleCode) => {
        const item = assessments.find((assessment) => assessment.scaleCode === scaleCode);
        return item ? { ...item, scoreNumeric: item.scoreNumeric === null ? null : Number(item.scoreNumeric) } : null;
      }).filter(Boolean),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthenticatedUser("consultation.write");
    const { id } = await context.params;
    const consultation = await consultationContext(id);
    if (consultation.status === "FINALIZED") {
      return NextResponse.json({ code: "CONSULTATION_FINALIZED", message: "Consulta finalizada não aceita nova avaliação." }, { status: 409 });
    }
    const { scaleCode, answers } = parseBody(await request.json());
    const scored = scoreCognitiveQuickEntry(scaleCode, answers);
    const assessment = await saveScaleAssessment({
      consultationId: consultation.id,
      scaleCode,
      scaleVersion: scored.version,
      answers: scored.answers,
      scoreNumeric: scored.result.score,
      scoreText: scored.result.scoreText,
      classification: scored.result.classification,
      interpretation: scored.result.interpretation,
      clinicalColor: scored.result.clinicalColor,
    });
    return NextResponse.json({
      assessment: {
        id: assessment.id,
        consultationId: assessment.consultationId,
        scaleCode: assessment.scaleCode,
        scaleVersion: assessment.scaleVersion,
        appliedAt: assessment.appliedAt,
      },
      result: scored.result,
    }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
