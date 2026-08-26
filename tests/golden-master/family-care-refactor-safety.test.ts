import assert from "node:assert/strict";
import test from "node:test";
import {
  filterFamilySafeCareItems,
  isFamilySafeCareInstruction,
  sanitizeFamilyCarePlan,
} from "../../src/domain/family-care-safety.ts";

test("relatório familiar bloqueia investigação, exames e confirmação diagnóstica", () => {
  const professional = [
    "Confirmar com força de preensão palmar ou teste de sentar-levantar cinco vezes.",
    "Investigar causas secundárias de sarcopenia e condições de base.",
    "Considerar DXA/bioimpedância e testes de desempenho para confirmar/classificar sarcopenia.",
    "Solicitar exames laboratoriais para avaliar causas reversíveis.",
    "Reavaliar doses conforme função renal e hepática.",
    "Encaminhar para avaliação especializada.",
  ];

  for (const item of professional) {
    assert.equal(isFamilySafeCareInstruction(item), false, item);
  }
  assert.deepEqual(filterFamilySafeCareItems(professional), []);
});

test("relatório familiar preserva ações práticas, sinais de atenção e regra de não automedicação", () => {
  const familySafe = [
    "Mantenha corredores livres, bem iluminados e sem tapetes soltos.",
    "Anote quedas e quase quedas para contar à equipe.",
    "Não faça mudanças em medicamento por conta própria sem orientação.",
    "Procure atendimento imediato se houver falta de ar intensa ou desmaio.",
  ];

  assert.deepEqual(filterFamilySafeCareItems(familySafe), familySafe);
});

test("encaminhamentos permanecem exclusivos da área profissional", () => {
  const sanitized = sanitizeFamilyCarePlan({
    agora: ["Mantenha boa iluminação em casa."],
    medio: [],
    cuidador: ["Organize a rotina com apoio do cuidador."],
    encaminhamentos: ["Encaminhar para fisioterapia."],
    contato: ["Avise a equipe se houver nova queda."],
    urgencia: [],
  });

  assert.deepEqual(sanitized.encaminhamentos, []);
  assert.deepEqual(sanitized.agora, ["Mantenha boa iluminação em casa."]);
});
