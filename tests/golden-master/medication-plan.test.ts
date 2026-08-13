import assert from "node:assert/strict";
import test from "node:test";
import { groupMedicationPlan, renderMedicationPlanText } from "../../src/domain/medication-plan.ts";

const items = [
  { id: "1", name: "Donepezila", presentation: "5 mg", dose: "1 comprimido", route: "VO", moment: "noite" as const, continuous: true },
  { id: "2", name: "Aripiprazol", presentation: "1 mg/mL", dose: "1 mL", route: "VO", moment: "manha" as const, instructions: "Aumentar conforme plano médico." },
  { id: "3", name: "Risperidona", presentation: "1 mg", dose: "1 comprimido", route: "VO", moment: "se_necessario" as const },
];

test("plano agrupa por momento em ordem assistencial", () => {
  const groups = groupMedicationPlan(items);
  assert.deepEqual(groups.map((group) => group.moment), ["manha", "noite", "se_necessario"]);
});

test("plano textual preserva instruções e uso contínuo", () => {
  const text = renderMedicationPlanText("Paciente Teste", items);
  assert.match(text, /ARIPIPRAZOL/i);
  assert.match(text, /Aumentar conforme plano médico/);
  assert.match(text, /uso contínuo/);
});

test("plano rejeita id duplicado", () => {
  assert.throws(() => groupMedicationPlan([items[0]!, items[0]!]), /duplicado/);
});
