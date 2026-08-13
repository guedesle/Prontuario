import assert from "node:assert/strict";
import test from "node:test";
import { buildFollowUpContext } from "../../src/domain/follow-up-context.ts";

test("consulta subsequente herda problemas ativos e exclui resolvidos", () => {
  const context = buildFollowUpContext({
    patientId: "p1",
    longitudinalAssessments: [],
    longitudinalProblems: [
      { id: "a", patientId: "p1", type: "CLINICAL", status: "ACTIVE", title: "HAS", priority: 1 },
      { id: "b", patientId: "p1", type: "GERIATRIC", status: "RESOLVED", title: "Delirium", priority: 2 },
    ],
  });
  assert.deepEqual(context.inheritedProblems.map((problem) => problem.title), ["HAS"]);
});

test("consulta subsequente bloqueia mistura de paciente", () => {
  assert.throws(() => buildFollowUpContext({
    patientId: "p1",
    longitudinalAssessments: [{ patientId: "p2", consultationId: "c1", scaleCode: "barthel", scaleVersion: "1", score: 50, appliedAt: new Date() }],
    longitudinalProblems: [],
  }), /outro paciente/);
});

test("avaliações alteradas geram propostas e nunca problemas automáticos confirmados", () => {
  const context = buildFollowUpContext({
    patientId: "p1",
    longitudinalAssessments: [
      { patientId: "p1", consultationId: "c1", scaleCode: "sarcf", scaleVersion: "1", score: 5, scoreText: "5", color: "vermelho", classification: "Risco elevado", appliedAt: new Date() },
      { patientId: "p1", consultationId: "c1", scaleCode: "mna_sf", scaleVersion: "1", score: 8, scoreText: "8", color: "amarelo", classification: "Risco de desnutrição", appliedAt: new Date() },
    ],
    longitudinalProblems: [],
  });
  assert.ok(context.proposedProblems.some((proposal) => proposal.key === "sarcopenia-performance"));
  assert.ok(context.proposedProblems.some((proposal) => proposal.key === "nutritional-risk"));
  assert.ok(context.proposedProblems.every((proposal) => proposal.requiresPhysicianConfirmation));
});
