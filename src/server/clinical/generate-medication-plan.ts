import type { Prisma } from "../../generated/prisma/client";
import { buildMedicationPlanSnapshotModel } from "../../domain/medication-plan-snapshot";
import { withDocumentSnapshotWriteRetry } from "../../domain/document-snapshot-versioning";
import { requireAuthenticatedUser } from "../auth/require-user";
import { prisma } from "../db";
import { createDocumentSnapshotInTransaction } from "./persistence";
import { workspaceContext } from "./medication-workspace";

export async function generateMedicationPlan(input: {
  consultationId: string;
  requestId?: string;
}) {
  await requireAuthenticatedUser("patient.read");
  const { user } = await requireAuthenticatedUser("document.generate");

  return withDocumentSnapshotWriteRetry(() =>
    prisma.$transaction(async (tx) => {
      const workspace = (await workspaceContext(tx, input.consultationId)).view;

      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: {
          id: true,
          patientId: true,
          patient: {
            select: { fullName: true },
          },
        },
      });

      if (!consultation) {
        throw new Error("Consulta não encontrada.");
      }

      const model = buildMedicationPlanSnapshotModel({
        consultationId: consultation.id,
        patientName: consultation.patient.fullName,
        workspace,
      });

      const snapshot = await createDocumentSnapshotInTransaction(tx, {
        consultationId: consultation.id,
        type: "MEDICATION_PLAN",
        contentSchemaVersion: model.schemaVersion,
        content: model as unknown as Prisma.InputJsonValue,
        requestId: input.requestId,
        generatedById: user.id,
      });

      return {
        model,
        plan: model.plan,
        text: model.text,
        excluded: model.excluded,
        snapshot,
      };
    }, { isolationLevel: "Serializable" }),
  );
}
