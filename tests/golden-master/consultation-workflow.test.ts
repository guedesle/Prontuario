import test from "node:test";
import assert from "node:assert/strict";
import {
  assertConsultationCanFinalize,
  assertConsultationEditable,
  assertConsultationTransition,
} from "../../src/domain/security/consultation-workflow.ts";

test("workflow permite rascunho -> revisão -> finalização e bloqueia atalhos", () => {
  assert.doesNotThrow(() => assertConsultationTransition("DRAFT", "IN_REVIEW"));
  assert.doesNotThrow(() => assertConsultationTransition("IN_REVIEW", "FINALIZED"));
  assert.throws(() => assertConsultationTransition("DRAFT", "FINALIZED"));
  assert.throws(() => assertConsultationTransition("FINALIZED", "DRAFT"));
});

test("finalização exige identidade, revisão e resolução de alerta urgente", () => {
  const base = {
    selectedPatientId: "p1", consultationPatientId: "p1",
    selectedConsultationId: "c1", consultationId: "c1",
    status: "IN_REVIEW" as const, clinicalReviewConfirmed: true,
    unresolvedUrgentAlerts: [] as string[],
  };
  assert.doesNotThrow(() => assertConsultationCanFinalize(base));
  assert.throws(() => assertConsultationCanFinalize({ ...base, consultationPatientId: "p2" }));
  assert.throws(() => assertConsultationCanFinalize({ ...base, clinicalReviewConfirmed: false }));
  assert.throws(() => assertConsultationCanFinalize({ ...base, unresolvedUrgentAlerts: ["CAM positivo"] }));
});

test("consulta finalizada é imutável", () => {
  assert.doesNotThrow(() => assertConsultationEditable("DRAFT"));
  assert.throws(() => assertConsultationEditable("FINALIZED"));
});
