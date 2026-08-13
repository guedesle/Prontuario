import { prisma } from "../db";
import { requireAuthenticatedUser } from "../auth/require-user";
import { assertConsultationCanFinalize } from "../../domain/security/consultation-workflow";

export async function finalizeConsultation(input: {
  patientId: string;
  consultationId: string;
  clinicalReviewConfirmed: boolean;
  unresolvedUrgentAlerts: readonly string[];
  requestId?: string;
}) {
  const { user } = await requireAuthenticatedUser("consultation.finalize");

  return prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.findUnique({
      where: { id: input.consultationId },
      select: { id: true, patientId: true, status: true },
    });
    if (!consultation) throw new Error("Consulta não encontrada.");

    assertConsultationCanFinalize({
      selectedPatientId: input.patientId,
      consultationPatientId: consultation.patientId,
      selectedConsultationId: input.consultationId,
      consultationId: consultation.id,
      status: consultation.status,
      clinicalReviewConfirmed: input.clinicalReviewConfirmed,
      unresolvedUrgentAlerts: input.unresolvedUrgentAlerts,
    });

    const updated = await tx.consultation.updateMany({
      where: { id: consultation.id, patientId: consultation.patientId, status: "IN_REVIEW" },
      data: { status: "FINALIZED" },
    });
    if (updated.count !== 1) {
      throw new Error("A consulta mudou durante a finalização; recarregue antes de tentar novamente.");
    }

    await tx.auditEvent.create({
      data: {
        userId: user.id,
        entityType: "Consultation",
        entityId: consultation.id,
        action: "consultation.finalize",
        requestId: input.requestId,
        outcome: "success",
      },
    });

    return { id: consultation.id, patientId: consultation.patientId, status: "FINALIZED" as const };
  });
}
