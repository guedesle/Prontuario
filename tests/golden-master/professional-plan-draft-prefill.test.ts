import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildProfessionalPlanDraft } from "../../src/domain/professional-plan-draft.ts";

const editor = readFileSync("src/components/consultations/soap-editor.tsx", "utf8");

const suggestion = {
  problemId: "problem-1",
  actions: ["Orientação sugerida 1", "Orientação sugerida 2"],
};

test("plano profissional pré-preenche sugestão somente quando não existe plano médico salvo", () => {
  assert.deepEqual(
    buildProfessionalPlanDraft({
      savedPlanByProblem: {},
      suggestions: [suggestion],
      seedSuggestions: true,
    }),
    { "problem-1": "Orientação sugerida 1\nOrientação sugerida 2" },
  );

  assert.deepEqual(
    buildProfessionalPlanDraft({
      savedPlanByProblem: { "problem-1": ["Conduta médica já registrada"] },
      suggestions: [suggestion],
      seedSuggestions: true,
    }),
    { "problem-1": "Conduta médica já registrada" },
  );
});

test("sugestão automática nunca cria plano sintético em consulta finalizada", () => {
  assert.deepEqual(
    buildProfessionalPlanDraft({
      savedPlanByProblem: {},
      suggestions: [suggestion],
      seedSuggestions: false,
    }),
    {},
  );
});

test("integração do editor mantém pré-preenchimento como rascunho não salvo e remove a dependência de inserção manual", () => {
  assert.match(editor, /buildProfessionalPlanDraft/);
  assert.match(editor, /savedPlanByProblem: view\.fields\.planByProblem/);
  assert.match(editor, /suggestions: view\.planSuggestions/);
  assert.match(editor, /seedSuggestions: view\.consultationStatus !== "FINALIZED"/);
  assert.match(editor, /setDraft\(draftFromView\(body\)\);\s*setDirty\(false\)/);
  assert.match(editor, /As orientações sugeridas já aparecem no rascunho quando ainda não há plano salvo/);
  assert.doesNotMatch(editor, /Adicionar ao rascunho/);
  assert.doesNotMatch(editor, /nada é aplicado automaticamente/);
});
