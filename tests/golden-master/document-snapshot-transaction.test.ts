import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "../../src/generated/prisma/client.ts";
import { createDocumentSnapshotInTransaction } from "../../src/server/clinical/persistence.ts";

test("transaction-scoped snapshot derives patient, version and audit from server context", async () => {
  let snapshotData: Record<string, unknown> | undefined;
  let auditData: Record<string, unknown> | undefined;

  const tx = {
    consultation: {
      findUnique: async () => ({ id: "consultation-1", patientId: "patient-1", status: "DRAFT" }),
    },
    documentSnapshot: {
      findFirst: async () => ({ version: 2 }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        snapshotData = data;
        return { id: "snapshot-3", version: 3, ...data };
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditData = data;
        return { id: "audit-1", ...data };
      },
    },
  } as unknown as Prisma.TransactionClient;

  const snapshot = await createDocumentSnapshotInTransaction(tx, {
    consultationId: "consultation-1",
    type: "MEDICATION_PLAN",
    contentSchemaVersion: "medication-plan-v1",
    content: { plan: [] },
    requestId: "request-1",
    generatedById: "user-1",
  });

  assert.equal(snapshot.id, "snapshot-3");
  assert.equal(snapshotData?.patientId, "patient-1");
  assert.equal(snapshotData?.consultationId, "consultation-1");
  assert.equal(snapshotData?.version, 3);
  assert.equal(snapshotData?.generatedById, "user-1");
  assert.equal(snapshotData?.sourceConsultationStatus, "DRAFT");
  assert.equal(auditData?.userId, "user-1");
  assert.equal(auditData?.entityId, "snapshot-3");
  assert.equal(auditData?.requestId, "request-1");
  assert.equal(auditData?.reasonCode, "draft-context");
});

test("transaction-scoped snapshot fails closed when consultation no longer exists", async () => {
  let snapshotCreated = false;
  let auditCreated = false;

  const tx = {
    consultation: { findUnique: async () => null },
    documentSnapshot: {
      findFirst: async () => null,
      create: async () => {
        snapshotCreated = true;
        return { id: "unexpected" };
      },
    },
    auditEvent: {
      create: async () => {
        auditCreated = true;
        return { id: "unexpected" };
      },
    },
  } as unknown as Prisma.TransactionClient;

  await assert.rejects(
    createDocumentSnapshotInTransaction(tx, {
      consultationId: "missing-consultation",
      type: "MEDICATION_PLAN",
      content: { plan: [] },
      generatedById: "user-1",
    }),
    /Consulta não encontrada/,
  );

  assert.equal(snapshotCreated, false);
  assert.equal(auditCreated, false);
});
