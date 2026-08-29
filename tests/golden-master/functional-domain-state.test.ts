import assert from "node:assert/strict";
import test from "node:test";
import { buildAgaReportModel } from "../../src/domain/aga-report.ts";
import { buildReportDomainSummaries } from "../../src/domain/report-domain-summary.ts";

function functionalState(scaleCode: "katz" | "barthel" | "lawton", score: number) {
  const report = buildAgaReportModel({
    patientId: `patient-${scaleCode}-${score}`,
    consultationId: "consultation-current",
    consultationStatus: "IN_REVIEW",
    patientName: "Paciente Sintético",
    longitudinalProblems: [],
    longitudinalAssessments: [{
      patientId: `patient-${scaleCode}-${score}`,
      consultationId: "consultation-current",
      scaleCode,
      scaleVersion: "1.0",
      score,
      scoreText: String(score),
      classification: "registro legado",
      color: "verde",
      appliedAt: "2026-08-29",
    }],
  });
  return buildReportDomainSummaries(report.assessedScales, report.intrinsicCapacity)
    .find((domain) => domain.code === "funcionalidade");
}

test("Katz abaixo de 6 marca Funcionalidade como alterada mesmo com cor legada inconsistente", () => {
  for (const score of [5, 2]) {
    const functionality = functionalState("katz", score);
    assert.equal(functionality?.state, "altered");
    assert.equal(functionality?.stateLabel, "Alteração identificada — requer atenção");
  }
});

test("Barthel abaixo de 100 marca Funcionalidade como alterada mesmo com cor legada inconsistente", () => {
  const functionality = functionalState("barthel", 95);
  assert.equal(functionality?.state, "altered");
  assert.equal(functionality?.stateLabel, "Alteração identificada — requer atenção");
});

test("Lawton abaixo de 21 marca Funcionalidade como alterada mesmo com cor legada inconsistente", () => {
  const functionality = functionalState("lawton", 20);
  assert.equal(functionality?.state, "altered");
  assert.equal(functionality?.stateLabel, "Alteração identificada — requer atenção");
});

test("independência funcional plena permanece sem alteração se não houver outro sinal", () => {
  assert.equal(functionalState("katz", 6)?.state, "preserved");
  assert.equal(functionalState("barthel", 100)?.state, "preserved");
  assert.equal(functionalState("lawton", 21)?.state, "preserved");
});
