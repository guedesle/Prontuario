import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/generated/prisma/client.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;

function testClient() {
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL não configurada.");
  const url = new URL(databaseUrl);
  return new PrismaClient({
    adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.replace(/^\//, ""), connectionLimit: 4 }),
  });
}

test("oncogeriatria permite múltiplos episódios no mesmo Patient.id e bloqueia mistura horizontal", {
  skip: databaseUrl ? false : "TEST_DATABASE_URL não configurada",
}, async () => {
  const client = testClient();
  const suffix = randomUUID();
  const userId = `onco-u-${suffix}`;
  const patientAId = `onco-pa-${suffix}`;
  const patientBId = `onco-pb-${suffix}`;
  const consultationAId = `onco-ca-${suffix}`;
  const consultationBId = `onco-cb-${suffix}`;
  const episodeA1 = `onco-ea1-${suffix}`;
  const episodeA2 = `onco-ea2-${suffix}`;
  const episodeB = `onco-eb-${suffix}`;
  const courseA = `onco-course-a-${suffix}`;
  const checkpointA = `onco-cp-a-${suffix}`;
  try {
    await client.user.create({ data: { id: userId, email: `onco-${suffix}@example.test`, name: "Médica Oncogeriatria" } });
    await client.patient.createMany({ data: [
      { id: patientAId, fullName: "Paciente Onco A", normalizedFullName: `paciente onco a ${suffix}`, identityFingerprint: `onco-a-${suffix}` },
      { id: patientBId, fullName: "Paciente Onco B", normalizedFullName: `paciente onco b ${suffix}`, identityFingerprint: `onco-b-${suffix}` },
    ] });
    await client.consultation.createMany({ data: [
      { id: consultationAId, patientId: patientAId, physicianId: userId, type: "AGA_INITIAL", occurredAt: new Date() },
      { id: consultationBId, patientId: patientBId, physicianId: userId, type: "AGA_INITIAL", occurredAt: new Date() },
    ] });
    await client.oncogeriatricEpisode.createMany({ data: [
      { id: episodeA1, patientId: patientAId, diagnosis: "Neoplasia A1", createdById: userId },
      { id: episodeA2, patientId: patientAId, diagnosis: "Neoplasia A2", createdById: userId },
      { id: episodeB, patientId: patientBId, diagnosis: "Neoplasia B", createdById: userId },
    ] });
    assert.equal(await client.oncogeriatricEpisode.count({ where: { patientId: patientAId } }), 2);

    await client.oncogeriatricTreatmentCourse.create({ data: { id: courseA, episodeId: episodeA1, patientId: patientAId, modality: "SYSTEMIC", intent: "CURATIVE", regimenName: "Esquema teste", createdById: userId } });
    await client.oncogeriatricCheckpoint.create({ data: { id: checkpointA, patientId: patientAId, episodeId: episodeA1, treatmentCourseId: courseA, consultationId: consultationAId, type: "PRE_TREATMENT", occurredAt: new Date(), createdById: userId } });

    await assert.rejects(client.oncogeriatricTreatmentCourse.create({ data: { episodeId: episodeA1, patientId: patientBId, modality: "SYSTEMIC", intent: "CURATIVE", regimenName: "Mistura indevida", createdById: userId } }));
    await assert.rejects(client.oncogeriatricCheckpoint.create({ data: { patientId: patientAId, episodeId: episodeA1, consultationId: consultationBId, type: "CYCLE", occurredAt: new Date(), createdById: userId } }));
    await assert.rejects(client.oncogeriatricCheckpoint.create({ data: { patientId: patientBId, episodeId: episodeB, treatmentCourseId: courseA, type: "CYCLE", occurredAt: new Date(), createdById: userId } }));
  } finally {
    await client.oncogeriatricRecoveryAssessment.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricToxicityEvent.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricIntervention.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricReportSnapshot.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricCheckpoint.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricTreatmentCourse.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.oncogeriatricEpisode.deleteMany({ where: { patientId: { in: [patientAId, patientBId] } } });
    await client.consultation.deleteMany({ where: { id: { in: [consultationAId, consultationBId] } } });
    await client.patient.deleteMany({ where: { id: { in: [patientAId, patientBId] } } });
    await client.user.deleteMany({ where: { id: userId } });
    await client.$disconnect();
  }
});
