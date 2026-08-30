import assert from "node:assert/strict";
import test from "node:test";
import {
  latestMedicationSuspensionAsOf,
  medicationStatusAsOf,
  type MedicationStatusTimelineEvent,
} from "../../src/domain/medication-status-history.ts";

const events: MedicationStatusTimelineEvent[] = [
  {
    id: "event-baseline",
    medicationId: "med-1",
    patientId: "p1",
    consultationId: "baseline",
    previousStatus: null,
    newStatus: "ACTIVE",
    createdAt: "2026-01-01T09:00:00Z",
  },
  {
    id: "event-a",
    medicationId: "med-1",
    patientId: "p1",
    consultationId: "consultation-a",
    previousStatus: "ACTIVE",
    newStatus: "SUSPENDED",
    createdAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "event-b",
    medicationId: "med-1",
    patientId: "p1",
    consultationId: "consultation-b",
    previousStatus: "SUSPENDED",
    newStatus: "ACTIVE",
    createdAt: "2026-06-01T09:00:00Z",
  },
];

test("sem evento explícito o status histórico permanece desconhecido", () => {
  assert.deepEqual(medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: [],
  }), {
    known: false,
    status: null,
    source: "NO_EXPLICIT_STATUS_HISTORY",
  });
});

test("reconstrói status somente até o horizonte solicitado", () => {
  const baseline = medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events,
  });
  assert.equal(baseline.status, "ACTIVE");
  assert.equal(baseline.lastEventConsultationId, "baseline");

  const followUp = medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a"],
    events,
  });
  assert.equal(followUp.status, "SUSPENDED");
  assert.equal(followUp.lastEventConsultationId, "consultation-a");
  assert.equal(followUp.lastEventAt, "2026-03-01T09:00:00.000Z");

  const later = medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a", "consultation-b"],
    events,
  });
  assert.equal(later.status, "ACTIVE");
});

test("histórico mantém a última suspensão mesmo após reintrodução posterior", () => {
  const suspension = latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a", "consultation-b"],
    events,
  });
  assert.deepEqual(suspension, {
    consultationId: "consultation-a",
    suspendedAt: "2026-03-01T09:00:00.000Z",
  });
});

test("sem evento de suspensão o medicamento não entra no histórico de suspensões", () => {
  assert.equal(latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events,
  }), undefined);
});

test("evento futuro não retroage para documento histórico", () => {
  const projected = medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a"],
    events,
  });
  assert.equal(projected.status, "SUSPENDED");
  assert.notEqual(projected.lastEventConsultationId, "consultation-b");

  const suspension = latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events,
  });
  assert.equal(suspension, undefined);
});

test("eventos da mesma consulta respeitam ordem de criação e id como desempate", () => {
  const sameConsultation: MedicationStatusTimelineEvent[] = [
    {
      id: "event-2",
      medicationId: "med-1",
      patientId: "p1",
      consultationId: "baseline",
      previousStatus: "SUSPENDED",
      newStatus: "ACTIVE",
      createdAt: "2026-01-01T10:00:00Z",
    },
    {
      id: "event-1",
      medicationId: "med-1",
      patientId: "p1",
      consultationId: "baseline",
      previousStatus: null,
      newStatus: "SUSPENDED",
      createdAt: "2026-01-01T09:00:00Z",
    },
  ];

  const projected = medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: sameConsultation,
  });
  assert.equal(projected.status, "ACTIVE");
  assert.deepEqual(latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: sameConsultation,
  }), {
    consultationId: "baseline",
    suspendedAt: "2026-01-01T09:00:00.000Z",
  });
});

test("mistura de paciente ou medicamento falha fechado", () => {
  assert.throws(() => medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: [{ ...events[0]!, patientId: "p2" }],
  }), /pacientes diferentes/);

  assert.throws(() => medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: [{ ...events[0]!, medicationId: "med-2" }],
  }), /medicamentos diferentes/);

  assert.throws(() => latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline"],
    events: [{ ...events[0]!, patientId: "p2" }],
  }), /pacientes diferentes/);
});

test("cadeia explícita inconsistente é rejeitada em vez de inferida", () => {
  const inconsistent = [
    events[0]!,
    { ...events[1]!, previousStatus: "FINISHED" as const },
  ];
  assert.throws(() => medicationStatusAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a"],
    events: inconsistent,
  }), /transição inconsistente/);
  assert.throws(() => latestMedicationSuspensionAsOf({
    patientId: "p1",
    medicationId: "med-1",
    consultationIds: ["baseline", "consultation-a"],
    events: inconsistent,
  }), /transição inconsistente/);
});