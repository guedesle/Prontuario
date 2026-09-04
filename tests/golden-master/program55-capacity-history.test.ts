import assert from "node:assert/strict";
import test from "node:test";
import { buildProgram55CapacityHistory } from "../../src/domain/program55/capacity-history.ts";

test("Programa 55+ inclui somente consultas vinculadas aos checkpoints", () => {
  const history = buildProgram55CapacityHistory({
    patientId: "p1",
    checkpoints: [{ coordinatingConsultationId: "linked" }],
    consultations: [
      { id: "linked", patientId: "p1", occurredAt: "2026-01-01" },
      { id: "outside", patientId: "p1", occurredAt: "2026-02-01" },
    ],
    assessments: [
      { id: "inside", patientId: "p1", consultationId: "linked", scaleCode: "lawton", scaleVersion: "1", scoreNumeric: 18, clinicalColor: "amarelo", appliedAt: "2026-01-01" },
      { id: "outside", patientId: "p1", consultationId: "outside", scaleCode: "lawton", scaleVersion: "1", scoreNumeric: 21, clinicalColor: "verde", appliedAt: "2026-02-01" },
    ],
  });

  assert.deepEqual(history.consultations.map((item) => item.id), ["linked"]);
  assert.equal(history.dimensions.find((item) => item.code === "funcionalidade")?.cells[0]?.assessments[0]?.assessmentId, "inside");
});

test("página 55+ oferece séries numéricas e gráfico de domínios do ciclo", async () => {
  const { readFile } = await import("node:fs/promises");
  const page = await readFile("src/app/patients/[id]/programa-55/longitudinal/page.tsx", "utf8");
  assert.match(page, /program55LinkedConsultationIds/);
  assert.match(page, /ClinicalMetricTrendChart/);
  assert.match(page, /CapacityDimensionHistoryChart/);
  assert.match(page, /Somente avaliações de consultas explicitamente vinculadas/);
});
