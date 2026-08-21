import assert from "node:assert/strict";
import test from "node:test";
import type { LongitudinalAssessment } from "../../src/domain/clinical-change-summary.ts";
import { buildProfessionalPlanSuggestions } from "../../src/domain/professional-plan-suggestions.ts";

function assessment(overrides: Partial<LongitudinalAssessment> = {}): LongitudinalAssessment {
  return {
    patientId: "patient-1",
    consultationId: "consultation-current",
    scaleCode: "sarcf",
    scaleVersion: "1.0",
    score: 5,
    scoreText: "5/10",
    classification: "Rastreio positivo — sarcopenia provável",
    color: "vermelho",
    appliedAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

const problem = {
  id: "problem-1",
  patientId: "patient-1",
  title: "Risco de sarcopenia / desempenho físico reduzido",
  status: "ACTIVE" as const,
};

test("professional plan draft requires confirmed matching problem and current altered assessment", () => {
  const suggestions = buildProfessionalPlanSuggestions({
    targetConsultationId: "consultation-current",
    patientId: "patient-1",
    problems: [problem],
    assessments: [assessment()],
  });
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0]?.problemId, problem.id);
  assert.equal(suggestions[0]?.requiresPhysicianReview, true);
  assert.equal(suggestions[0]?.evidence[0]?.scaleCode, "sarcf");
  assert.ok(suggestions[0]?.sources.some((source) => source.pmid === "30312372"));
});

test("historical, future, other-patient and preserved results never justify a current suggestion", () => {
  for (const item of [
    assessment({ consultationId: "consultation-old" }),
    assessment({ consultationId: "consultation-future" }),
    assessment({ patientId: "patient-2" }),
    assessment({ color: "verde" }),
    assessment({ color: "cinza" }),
  ]) {
    const suggestions = buildProfessionalPlanSuggestions({
      targetConsultationId: "consultation-current",
      patientId: "patient-1",
      problems: [problem],
      assessments: [item],
    });
    assert.deepEqual(suggestions, []);
  }
});

test("resolved problems and manual problems without a reviewed rule receive no automatic suggestion", () => {
  const resolved = buildProfessionalPlanSuggestions({
    targetConsultationId: "consultation-current",
    patientId: "patient-1",
    problems: [{ ...problem, status: "RESOLVED" }],
    assessments: [assessment()],
  });
  const manual = buildProfessionalPlanSuggestions({
    targetConsultationId: "consultation-current",
    patientId: "patient-1",
    problems: [{ ...problem, id: "manual", title: "Problema clínico livre sem regra revisada" }],
    assessments: [assessment()],
  });
  assert.deepEqual(resolved, []);
  assert.deepEqual(manual, []);
});

test("medication-risk suggestion is a review draft and never encodes an automatic medication change", () => {
  const suggestions = buildProfessionalPlanSuggestions({
    targetConsultationId: "consultation-current",
    patientId: "patient-1",
    problems: [{ id: "med", patientId: "patient-1", title: "Risco relacionado a medicamentos / polifarmácia", status: "MONITORING" }],
    assessments: [assessment({ scaleCode: "stoppfall", score: 3, scoreText: "3 classes", classification: "Alto risco medicamentoso para quedas" })],
  });
  assert.equal(suggestions.length, 1);
  const text = suggestions[0]!.actions.join(" ").toLocaleLowerCase("pt-BR");
  assert.match(text, /decisão médica explícita/);
  assert.doesNotMatch(text, /iniciar vitamina|prescrever|suspender [a-z]|substituir [a-z]|ajustar a dose/);
  assert.deepEqual(suggestions[0]!.sources.map((source) => source.pmid), ["33349863", "25798731", "36178003"]);
});

test("unsupported proposal categories fail closed instead of inventing a recommendation", () => {
  const suggestions = buildProfessionalPlanSuggestions({
    targetConsultationId: "consultation-current",
    patientId: "patient-1",
    problems: [{ id: "social", patientId: "patient-1", title: "Vulnerabilidade da rede de suporte familiar/social", status: "STABLE" }],
    assessments: [assessment({ scaleCode: "apgar_familiar", score: 3, scoreText: "3/10", classification: "Disfunção familiar", color: "vermelho" })],
  });
  assert.deepEqual(suggestions, []);
});
