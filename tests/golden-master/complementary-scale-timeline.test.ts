import assert from "node:assert/strict";
import test from "node:test";
import { complementaryScaleConsultationHorizonIds } from "../../src/domain/complementary-scale-timeline.ts";

test("complementary scale reads exclude consultations after the target consultation", () => {
  const patientId = "patient-1";
  const consultations = [
    { id: "baseline", patientId, occurredAt: "2026-01-10T10:00:00Z", createdAt: "2026-01-10T10:00:00Z" },
    { id: "target", patientId, occurredAt: "2026-02-10T10:00:00Z", createdAt: "2026-02-10T10:00:00Z" },
    { id: "future", patientId, occurredAt: "2026-03-10T10:00:00Z", createdAt: "2026-03-10T10:00:00Z" },
  ];

  assert.deepEqual(
    complementaryScaleConsultationHorizonIds({ patientId, targetConsultationId: "target", consultations }),
    ["baseline", "target"],
  );
});

test("complementary scale horizon fails closed when consultation timeline mixes patients", () => {
  assert.throws(
    () => complementaryScaleConsultationHorizonIds({
      patientId: "patient-1",
      targetConsultationId: "target",
      consultations: [
        { id: "target", patientId: "patient-1", occurredAt: "2026-02-10T10:00:00Z", createdAt: "2026-02-10T10:00:00Z" },
        { id: "foreign", patientId: "patient-2", occurredAt: "2026-01-10T10:00:00Z", createdAt: "2026-01-10T10:00:00Z" },
      ],
    }),
    /misturar pacientes diferentes/i,
  );
});
