import assert from "node:assert/strict";
import test from "node:test";
import { buildAgaReportModel, renderAgaReportText } from "../../src/domain/aga-report.ts";

const problems = [
  { id: "c1", patientId: "p1", type: "CLINICAL" as const, status: "ACTIVE" as const, title: "Hipertensão arterial" },
  { id: "g1", patientId: "p1", type: "GERIATRIC" as const, status: "RESOLVED" as const, title: "Delirium prévio" },
];

test("relatório separa dado, resultado, interpretação, proposta, intervenção e evolução", () => {
  const report = buildAgaReportModel({
    patientId: "p1",
    consultationId: "current",
    consultationStatus: "DRAFT",
    patientName: "Paciente Teste",
    longitudinalProblems: problems,
    longitudinalAssessments: [
      { patientId: "p1", consultationId: "baseline", scaleCode: "sarcf", scaleVersion: "1.0", score: 3, scoreText: "3", classification: "Baixo risco", interpretation: "Rastreio inicial.", answers: { sf1: 1 }, color: "verde", isBaseline: true, appliedAt: "2026-01-01" },
      { patientId: "p1", consultationId: "current", scaleCode: "sarcf", scaleVersion: "1.0", score: 5, scoreText: "5", classification: "Rastreio positivo", interpretation: "Sarcopenia provável.", answers: { sf1: 2 }, color: "vermelho", appliedAt: "2026-08-01" },
    ],
  });
  const section = report.assessedScales[0]!;
  assert.deepEqual(section.collectedData, [{ field: "sf1", value: "2" }]);
  assert.equal(section.result.score, 5);
  assert.equal(section.interpretation, "Sarcopenia provável.");
  assert.ok(section.relatedProblemProposals.length > 0);
  assert.ok(section.interventionSuggestions.every((item) => item.reviewStatus === "pending-medical-review"));
  assert.equal(section.evolution.baseline, 3);
  assert.equal(report.geriatricProblems[0]?.status, "RESOLVED");
});

test("relatório sem escala não inventa pontuação ou interpretação", () => {
  const report = buildAgaReportModel({
    patientId: "p1",
    consultationId: "c1",
    consultationStatus: "IN_REVIEW",
    patientName: "Paciente Teste",
    longitudinalProblems: [],
    longitudinalAssessments: [],
  });
  assert.deepEqual(report.assessedScales, []);
  assert.ok(report.notAssessedScaleCodes.includes("katz"));
  assert.doesNotMatch(renderAgaReportText(report), /Katz \(/);
});

test("relatório pode ser gerado antes da finalização e mantém aviso", () => {
  const report = buildAgaReportModel({
    patientId: "p1", consultationId: "c1", consultationStatus: "DRAFT", patientName: "Teste",
    longitudinalProblems: [], longitudinalAssessments: [],
  });
  assert.equal(report.draftContext, true);
  assert.match(renderAgaReportText(report), /antes da finalização/);
});

test("relatório bloqueia mistura de pacientes", () => {
  assert.throws(() => buildAgaReportModel({
    patientId: "p1", consultationId: "c1", consultationStatus: "DRAFT", patientName: "Teste",
    longitudinalProblems: [{ ...problems[0]!, patientId: "p2" }], longitudinalAssessments: [],
  }), /outro paciente/);
});
