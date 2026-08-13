import assert from "node:assert/strict";
import test from "node:test";
import { buildFamilyReportModel, renderFamilyReportText, renderSoapText } from "../../src/domain/document-renderers.ts";
import { emptyInterventionPlan } from "../../src/domain/interventions.ts";

const problems = [
  { id: "p1", patientId: "patient", type: "CLINICAL" as const, status: "ACTIVE" as const, title: "Hipertensão arterial" },
  { id: "p2", patientId: "patient", type: "GERIATRIC" as const, status: "ACTIVE" as const, title: "Risco de quedas" },
];

test("SOAP mantém quatro seções e usa sem dados registrados", () => {
  const text = renderSoapText({ problems });
  assert.match(text, /S — SUBJETIVO/);
  assert.match(text, /O — OBJETIVO/);
  assert.match(text, /A — AVALIAÇÃO/);
  assert.match(text, /P — PLANO/);
  assert.ok(text.includes("sem dados registrados"));
  assert.ok(text.includes("Hipertensão arterial"));
});

test("SOAP inclui medicações no Objetivo", () => {
  const text = renderSoapText({
    subjective: "Sem queixas novas.",
    problems,
    medications: [{ name: "Losartana", dose: "50 mg", route: "VO", frequency: "1x/dia" }],
  });
  assert.match(text, /Medicações em uso:/);
  assert.match(text, /Losartana — 50 mg · VO · 1x\/dia/);
});

test("relatório familiar separa problemas clínicos e geriátricos", () => {
  const plan = emptyInterventionPlan();
  plan.agora.push("Manter rotina organizada.");
  const model = buildFamilyReportModel({ patientName: "Paciente Teste", problems, plan, contactPhone: "71 99992-1416" });
  assert.deepEqual(model.clinicalProblems, ["Hipertensão arterial"]);
  assert.deepEqual(model.geriatricProblems, ["Risco de quedas"]);
  const text = renderFamilyReportText(model);
  assert.match(text, /Problemas clínicos/);
  assert.match(text, /Problemas geriátricos/);
  assert.match(text, /71 99992-1416/);
});
