import test from "node:test";
import assert from "node:assert/strict";
import { assertAuditMetadataSafe, buildAuditRecord } from "../../src/domain/security/audit.ts";

test("auditoria aceita identificadores operacionais e rejeita conteúdo clínico livre", () => {
  assert.doesNotThrow(() => assertAuditMetadataSafe({ requestId: "r1", reasonCode: "USER_DISABLED" }));
  assert.throws(() => assertAuditMetadataSafe({ patientName: "Pessoa Teste" }));
  assert.throws(() => assertAuditMetadataSafe({ subjective: "dor" }));
});

test("registro de auditoria exige ator, ação e entidade", () => {
  const record = buildAuditRecord({ actorUserId: "u1", action: "consultation.finalize", entityType: "Consultation", entityId: "c1", outcome: "success" }, new Date("2026-08-13T12:00:00Z"));
  assert.equal(record.entityId, "c1");
  assert.throws(() => buildAuditRecord({ actorUserId: "", action: "x", entityType: "Y", entityId: "1" }));
});
