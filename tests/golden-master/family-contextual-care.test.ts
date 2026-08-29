import assert from "node:assert/strict";
import test from "node:test";
import {
  applyContextualFamilyCarePlan,
  deriveEstablishedImmobilityContext,
  gastrostomyFamilyGuidance,
  hasGastrostomyMedicationRoute,
} from "../../src/domain/family-contextual-care.ts";

const fastScale = (score: number) => ({
  code: "fast",
  assessedInTargetConsultation: true,
  result: { score },
});

test("FAST 7c ou superior estabelece imobilidade e elimina meta automática de marcha independente", () => {
  const immobility = deriveEstablishedImmobilityContext({ scales: [fastScale(7.3)] });
  assert.equal(immobility.established, true);
  assert.equal(immobility.source, "FAST_7C_OR_HIGHER");
  assert.equal(immobility.fastStage, "7c");

  const contextual = applyContextualFamilyCarePlan({
    plan: {
      now: ["Caminhar 20 minutos por dia.", "Manter rotina de sono."],
      mediumTerm: ["Treinar marcha de forma independente."],
      caregiver: ["Estimular caminhadas diárias."],
      referrals: ["Fisioterapia"],
      contact: [],
      urgent: [],
    },
    immobility,
    gastrostomyPresent: false,
  });

  const text = [...contextual.now, ...contextual.mediumTerm, ...contextual.caregiver].join(" ");
  assert.doesNotMatch(text, /caminhar 20|minutos.*caminh|marcha de forma independente|estimular caminhadas/i);
  assert.match(text, /FAST 7c/i);
  assert.match(text, /transferências seguras/i);
});

test("problema geriátrico Imobilidade aplica as mesmas prioridades sem inventar FAST", () => {
  const immobility = deriveEstablishedImmobilityContext({
    scales: [],
    geriatricProblems: [{ title: "Imobilidade", status: "ACTIVE" }],
  });
  assert.equal(immobility.established, true);
  assert.equal(immobility.source, "GERIATRIC_PROBLEM");
  assert.equal(immobility.fastScore, undefined);

  const contextual = applyContextualFamilyCarePlan({
    plan: { now: [], mediumTerm: [], caregiver: [], referrals: [], contact: [], urgent: [] },
    immobility,
    gastrostomyPresent: false,
  });
  assert.match(contextual.now.join(" "), /imobilidade está registrada como problema geriátrico/i);
  assert.match(contextual.caregiver.join(" "), /transferências/i);
});

test("via GTT ativa cuidados específicos de gastrostomia sem inventar dieta, volume ou diluição", () => {
  assert.equal(hasGastrostomyMedicationRoute([{ route: "Via gastrostomia (GTT)", status: "ACTIVE" }]), true);
  assert.equal(hasGastrostomyMedicationRoute([{ route: "Via oral", status: "ACTIVE" }]), false);
  const guidance = gastrostomyFamilyGuidance();
  const text = [...guidance.now, ...guidance.caregiver, ...guidance.contact].join(" ");
  assert.match(text, /dieta enteral/i);
  assert.match(text, /não triture comprimidos/i);
  assert.match(text, /estoma/i);
  assert.match(text, /volume de água individualmente orientado/i);
  assert.doesNotMatch(text, /\b\d+\s*mL\b/i);
  assert.doesNotMatch(text, /\b\d+\s*kcal\b/i);
});
