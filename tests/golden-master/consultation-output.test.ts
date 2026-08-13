import assert from "node:assert/strict";
import test from "node:test";
import { buildConsultationOutputs } from "../../src/domain/consultation-output.ts";
import { DEMO_ASSESSMENTS, DEMO_MEDICATIONS, DEMO_PATIENT, DEMO_PROBLEMS } from "../../src/domain/demo-case.ts";

test("pipeline end-to-end gera as três saídas sem promover propostas automaticamente", () => {
  const outputs = buildConsultationOutputs({
    patientId: DEMO_PATIENT.id,
    consultationId: "demo-follow-2",
    patientName: DEMO_PATIENT.name,
    longitudinalAssessments: DEMO_ASSESSMENTS,
    longitudinalProblems: DEMO_PROBLEMS,
    subjective: "Paciente em acompanhamento geriátrico.",
    physicalExam: "Sem dados registrados neste caso sintético.",
    medicationPlan: DEMO_MEDICATIONS,
    contactPhone: "71 99992-1416",
  });

  assert.ok(outputs.followUpContext.changeSummary.counts.unfavorable >= 2);
  assert.ok(outputs.followUpContext.proposedProblems.some((proposal) => proposal.key === "sarcopenia-performance"));
  assert.doesNotMatch(outputs.soapText, /Risco de sarcopenia \/ desempenho físico reduzido/);
  assert.match(outputs.soapText, /Hipertensão arterial/);
  assert.match(outputs.familyReportText, /Problemas geriátricos/);
  assert.match(outputs.familyReportText, /71 99992-1416/);
  assert.match(outputs.medicationPlanText, /PLANO DE MEDICAMENTOS/);
});

test("pipeline bloqueia contexto sem paciente ou consulta", () => {
  assert.throws(() => buildConsultationOutputs({
    patientId: "",
    consultationId: "c1",
    patientName: "Teste",
    longitudinalAssessments: [],
    longitudinalProblems: [],
  }), /obrigatórios/);
});
