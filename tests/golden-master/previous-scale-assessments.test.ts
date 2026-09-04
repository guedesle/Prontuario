import assert from "node:assert/strict";
import test from "node:test";
import { latestPreviousScaleAssessments } from "../../src/domain/previous-scale-assessments.ts";

const base = { patientId: "p1", scaleVersion: "1", scoreNumeric: 10, scoreText: "10", classification: "registrado" };

test("lembrete longitudinal seleciona o último registro anterior e nunca a consulta atual", () => {
  const previous = latestPreviousScaleAssessments({
    patientId: "p1",
    targetConsultationId: "c3",
    consultationIds: ["c1", "c2", "c3"],
    assessments: [
      { ...base, id: "lawton-old", consultationId: "c1", scaleCode: "lawton", appliedAt: "2026-01-01", scoreNumeric: 18 },
      { ...base, id: "lawton-previous", consultationId: "c2", scaleCode: "lawton", appliedAt: "2026-03-01", scoreNumeric: 20 },
      { ...base, id: "lawton-current", consultationId: "c3", scaleCode: "lawton", appliedAt: "2026-06-01", scoreNumeric: 21 },
      { ...base, id: "mna-previous", consultationId: "c1", scaleCode: "mna_sf", appliedAt: "2026-01-01", scoreNumeric: 12 },
    ],
  });

  assert.deepEqual(previous.map((item) => item.id), ["lawton-previous", "mna-previous"]);
  assert.ok(!previous.some((item) => item.consultationId === "c3"));
});

test("lembrete longitudinal falha fechado ao misturar pacientes", () => {
  assert.throws(() => latestPreviousScaleAssessments({
    patientId: "p1",
    targetConsultationId: "c2",
    consultationIds: ["c1", "c2"],
    assessments: [{ ...base, id: "wrong", patientId: "p2", consultationId: "c1", scaleCode: "lawton", appliedAt: "2026-01-01" }],
  }), /pacientes diferentes/);
});

test("workspace expõe histórico anterior sem selecionar instrumento automaticamente", async () => {
  const { readFile } = await import("node:fs/promises");
  const workspace = await readFile("src/components/scales/clinical-scales-workspace.tsx", "utf8");
  const route = await readFile("src/app/api/consultations/[id]/scales/status/route.ts", "utf8");
  assert.match(workspace, /com histórico anterior/);
  assert.match(workspace, /Último registro anterior/);
  assert.match(workspace, /não foi selecionada automaticamente/);
  assert.match(route, /latestPreviousScaleAssessments/);
  assert.match(route, /consultationHorizon/);
});
