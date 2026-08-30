import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMedicationPlanSnapshotModel,
  MedicationPlanSnapshotError,
} from "../../src/domain/medication-plan-snapshot.ts";
import type { MedicationWorkspaceView } from "../../src/domain/medication-workspace.ts";

function workspace(overrides: Partial<MedicationWorkspaceView> = {}): MedicationWorkspaceView {
  const { suspendedHistory = [], ...rest } = overrides;
  return {
    consultationId: "c2",
    consultationStatus: "IN_REVIEW",
    isLatestConsultation: true,
    items: [
      {
        medicationId: "m-active",
        name: "Losartana",
        presentation: "50 mg",
        medicationText: "Losartana 50 mg",
        doseInstruction: "1 comprimido",
        route: "Via oral",
        frequency: "DAILY",
        needsScheduleReview: false,
        moments: ["manha", "noite"],
        continuous: true,
        status: "ACTIVE",
        statusSource: "explicit-history",
      },
      {
        medicationId: "m-suspended",
        name: "Medicamento suspenso",
        medicationText: "Medicamento suspenso 10 mg",
        doseInstruction: "1 comprimido",
        route: "Via oral",
        frequency: "DAILY",
        needsScheduleReview: false,
        moments: ["manha"],
        continuous: false,
        status: "SUSPENDED",
        statusSource: "explicit-history",
      },
    ],
    suspendedHistory,
    ...rest,
  };
}

test("snapshot inclui somente medicamentos explicitamente em uso e preserva exclusões rastreáveis", () => {
  const model = buildMedicationPlanSnapshotModel({ consultationId: "c2", patientName: "Maria Teste", workspace: workspace() });
  assert.equal(model.schemaVersion, "1.1");
  assert.equal(model.plan.rows.length, 1);
  assert.equal(model.plan.rows[0]?.id, "m-active");
  assert.equal(model.plan.rows[0]?.moments.manha, true);
  assert.equal(model.plan.rows[0]?.moments.noite, true);
  assert.deepEqual(model.excluded, [{ medicationId: "m-suspended", status: "SUSPENDED" }]);
  assert.match(model.text, /Losartana 50 mg/);
  assert.doesNotMatch(model.text, /Medicamento suspenso/);
});

test("snapshot falha fechado quando status histórico ainda não foi explicitamente revisado", () => {
  const unresolved = workspace({
    items: [{
      medicationId: "m1",
      name: "Losartana",
      medicationText: "Losartana 50 mg",
      frequency: "DAILY",
      needsScheduleReview: false,
      moments: ["manha"],
      continuous: true,
      status: "ACTIVE",
      statusSource: "current-record-only",
    }],
  });
  assert.throws(
    () => buildMedicationPlanSnapshotModel({ consultationId: "c2", patientName: "Maria Teste", workspace: unresolved }),
    (error: unknown) => error instanceof MedicationPlanSnapshotError && error.code === "HISTORICAL_STATUS_NOT_REVIEWED",
  );
});

test("snapshot falha fechado quando frequência semanal ou mensal está incompleta", () => {
  const incomplete = workspace({
    items: [{
      medicationId: "m-weekly",
      name: "Medicamento semanal",
      medicationText: "Medicamento semanal 70 mg",
      route: "Via oral",
      frequency: "WEEKLY",
      schedule: { kind: "WEEKLY" },
      needsScheduleReview: true,
      moments: [],
      continuous: true,
      status: "ACTIVE",
      statusSource: "explicit-history",
    }],
  });
  assert.throws(
    () => buildMedicationPlanSnapshotModel({ consultationId: "c2", patientName: "Maria Teste", workspace: incomplete }),
    (error: unknown) => error instanceof MedicationPlanSnapshotError && error.code === "INCOMPLETE_SCHEDULE",
  );
});

test("snapshot preserva programação semanal completa", () => {
  const weekly = workspace({
    items: [{
      medicationId: "m-weekly",
      name: "Medicamento semanal",
      medicationText: "Medicamento semanal 70 mg",
      route: "Via oral",
      frequency: "WEEKLY",
      schedule: { kind: "WEEKLY", dayOfWeek: 2 },
      needsScheduleReview: false,
      moments: ["manha"],
      continuous: true,
      status: "ACTIVE",
      statusSource: "explicit-history",
    }],
  });
  const model = buildMedicationPlanSnapshotModel({ consultationId: "c2", patientName: "Maria Teste", workspace: weekly });
  assert.equal(model.plan.rows[0]?.frequency, "WEEKLY");
  assert.equal(model.plan.rows[0]?.scheduleLabel, "Terça-feira");
  assert.match(model.text, /1 vez por semana/);
  assert.doesNotMatch(model.text, /\[x\] Manhã/);
});

test("snapshot rejeita workspace de outra consulta", () => {
  assert.throws(
    () => buildMedicationPlanSnapshotModel({ consultationId: "c2", patientName: "Maria Teste", workspace: workspace({ consultationId: "c-other" }) }),
    (error: unknown) => error instanceof MedicationPlanSnapshotError && error.code === "CONSULTATION_CONTEXT_MISMATCH",
  );
});
