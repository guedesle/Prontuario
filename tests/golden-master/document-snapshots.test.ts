import assert from "node:assert/strict";
import test from "node:test";
import { assertSnapshotContext, nextDocumentVersion, versionDocumentSnapshot } from "../../src/domain/document-snapshots.ts";

test("snapshot bloqueia paciente divergente", () => {
  assert.throws(() => assertSnapshotContext({
    selectedPatientId: "p1",
    consultationPatientId: "p1",
    documentPatientId: "p2",
    selectedConsultationId: "c1",
    documentConsultationId: "c1",
  }), /Paciente inconsistente/);
});

test("snapshot bloqueia consulta divergente", () => {
  assert.throws(() => assertSnapshotContext({
    selectedPatientId: "p1",
    consultationPatientId: "p1",
    documentPatientId: "p1",
    selectedConsultationId: "c1",
    documentConsultationId: "c2",
  }), /Consulta inconsistente/);
});

test("versionamento é independente por consulta e tipo", () => {
  const existing = [
    { patientId: "p1", consultationId: "c1", type: "SOAP" as const, version: 1 },
    { patientId: "p1", consultationId: "c1", type: "SOAP" as const, version: 2 },
    { patientId: "p1", consultationId: "c1", type: "FAMILY_REPORT" as const, version: 1 },
  ];
  assert.equal(nextDocumentVersion(existing, "c1", "SOAP"), 3);
  assert.equal(nextDocumentVersion(existing, "c1", "FAMILY_REPORT"), 2);
  assert.equal(nextDocumentVersion(existing, "c2", "SOAP"), 1);
  const versioned = versionDocumentSnapshot({ document: { patientId: "p1", consultationId: "c1", type: "SOAP", content: { text: "x" } }, existing });
  assert.equal(versioned.version, 3);
});
