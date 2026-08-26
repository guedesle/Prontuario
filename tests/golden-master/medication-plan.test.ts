import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMedicationTextContainsNoSchedule,
  buildMedicationPlanViewModel,
  renderMedicationPlanText,
  validateMedicationPlan,
} from "../../src/domain/medication-plan.ts";

const items = [
  { id: "1", medicationText: "Losartana 50 mg", doseInstruction: "1 comprimido", route: "Via oral", moments: ["manha", "noite"] as const, continuous: true },
  { id: "2", medicationText: "Aripiprazol 1 mg/mL", doseInstruction: "1 mL", route: "Via oral", moments: ["manha"] as const, instructions: "Aumentar conforme plano médico." },
  { id: "3", medicationText: "Risperidona 1 mg", doseInstruction: "1 comprimido", route: "Via oral", moments: ["se_necessario"] as const },
];

test("um medicamento suporta múltiplos horários sem duplicar sua linha", () => {
  const text = renderMedicationPlanText("Paciente Teste", items);
  assert.equal(text.match(/Losartana 50 mg/g)?.length, 1);
  assert.match(text, /\[x\] Manhã/);
  assert.match(text, /\[x\] Noite/);
});

test("view model mantém uma linha por medicamento e horários booleanos independentes", () => {
  const model = buildMedicationPlanViewModel("Paciente Teste", items);

  assert.equal(model.patientName, "Paciente Teste");
  assert.equal(model.rows.length, 3);
  assert.equal(model.rows[0]?.medicationText, "Losartana 50 mg");
  assert.equal(model.rows[0]?.doseInstruction, "1 comprimido");
  assert.equal(model.rows[0]?.route, "Via oral");
  assert.equal(model.rows[0]?.frequency, "DAILY");
  assert.equal(model.rows[0]?.continuous, true);
  assert.equal(model.rows[0]?.moments.manha, true);
  assert.equal(model.rows[0]?.moments.noite, true);
  assert.equal(model.rows[0]?.moments.almoco, false);
  assert.equal(model.rows[2]?.frequency, "AS_NEEDED");
  assert.equal(model.rows[2]?.moments.se_necessario, true);
});

test("plano textual preserva instruções, via, dose e uso contínuo", () => {
  const text = renderMedicationPlanText("Paciente Teste", items);
  assert.match(text, /ARIPIPRAZOL/i);
  assert.match(text, /Aumentar conforme plano médico/);
  assert.match(text, /uso contínuo/);
  assert.match(text, /Frequência: Todos os dias/);
});

test("semanal e mensal são estruturados sem simular administração diária", () => {
  const model = buildMedicationPlanViewModel("Paciente Teste", [
    {
      id: "weekly",
      medicationText: "Medicamento semanal 70 mg",
      doseInstruction: "1 comprimido",
      route: "Via oral",
      frequency: "WEEKLY",
      schedule: { kind: "WEEKLY", dayOfWeek: 1 },
      moments: ["manha"] as const,
    },
    {
      id: "monthly",
      medicationText: "Medicamento mensal 60 mg",
      route: "Via subcutânea",
      frequency: "MONTHLY",
      schedule: { kind: "MONTHLY", dayOfMonth: 15 },
      moments: [] as const,
    },
  ]);

  assert.equal(model.rows[0]?.frequencyLabel, "1 vez por semana");
  assert.equal(model.rows[0]?.scheduleLabel, "Segunda-feira");
  assert.equal(model.rows[0]?.needsScheduleReview, false);
  assert.equal(model.rows[1]?.frequencyLabel, "1 vez por mês");
  assert.equal(model.rows[1]?.scheduleLabel, "Dia 15 de cada mês");

  const text = renderMedicationPlanText("Paciente Teste", [
    {
      id: "weekly",
      medicationText: "Medicamento semanal 70 mg",
      frequency: "WEEKLY",
      schedule: { kind: "WEEKLY", dayOfWeek: 1 },
      moments: ["manha"] as const,
    },
  ]);
  assert.match(text, /Frequência: 1 vez por semana · Segunda-feira/);
  assert.match(text, /Horário no dia: Manhã/);
  assert.doesNotMatch(text, /\[x\] Manhã/);
});

test("programação semanal ou mensal incompleta fica marcada para revisão", () => {
  const model = buildMedicationPlanViewModel("Paciente Teste", [
    { id: "weekly", medicationText: "Medicamento semanal 70 mg", frequency: "WEEKLY", moments: [] },
    { id: "monthly", medicationText: "Medicamento mensal 60 mg", frequency: "MONTHLY", moments: [] },
  ]);
  assert.equal(model.rows[0]?.needsScheduleReview, true);
  assert.equal(model.rows[1]?.needsScheduleReview, true);
});

test("plano rejeita id duplicado", () => {
  assert.throws(() => validateMedicationPlan([items[0]!, items[0]!]), /duplicado/);
});

test("texto rejeita frequência e horário em variantes usuais", () => {
  for (const value of [
    "Losartana 50 mg 2x/dia",
    "Losartana 50 mg 2 vezes ao dia",
    "Losartana 50 mg manhã e noite",
    "Losartana 50 mg MANHÃ/NOITE",
    "Losartana 50 mg manhã + noite",
  ]) {
    assert.throws(() => assertMedicationTextContainsNoSchedule(value), /frequência e horários nos campos estruturados/);
  }
});

test("limpeza preserva conteúdo clínico e remove apenas espaços redundantes", () => {
  const [item] = validateMedicationPlan([{ ...items[0]!, medicationText: "  Losartana   50 mg  " }]);
  assert.equal(item?.medicationText, "Losartana 50 mg");
});

test("plano exige paciente identificado antes de renderizar", () => {
  assert.throws(
    () => renderMedicationPlanText("   ", items),
    /vinculado a um paciente identificado/,
  );
});

test("nome do paciente permanece em uma única linha no cabeçalho e na tabela", () => {
  assert.throws(
    () => buildMedicationPlanViewModel("Paciente Teste\nOutro contexto", items),
    /Nome do paciente inválido/,
  );

  const model = buildMedicationPlanViewModel("  Paciente   Teste  ", items);
  assert.equal(model.patientName, "Paciente Teste");

  const text = renderMedicationPlanText("  Paciente   Teste  ", items);
  assert.match(text, /^PLANO DE MEDICAMENTOS — Paciente Teste$/m);
});
