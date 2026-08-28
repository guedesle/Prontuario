import assert from "node:assert/strict";
import test from "node:test";
import {
  GERIATRIC_VACCINE_CHECKLIST,
  buildVaccinationPreventionSection,
  deriveVaccinationReview,
  normalizeVaccinationReview,
} from "../../src/domain/vaccination-prevention.ts";

test("checklist geriátrico representa o calendário SBIm 2026/2027 sem gerar prescrição", () => {
  const routine = GERIATRIC_VACCINE_CHECKLIST.filter((item) => item.group === "ROTINA").map((item) => item.name);
  const special = GERIATRIC_VACCINE_CHECKLIST.filter((item) => item.group === "SITUACOES_ESPECIAIS").map((item) => item.name);
  const all = GERIATRIC_VACCINE_CHECKLIST.map((item) => item.name).join(" ");

  for (const expected of ["Influenza", "VPC20", "Herpes-zóster", "dTpa", "Hepatite B", "Febre amarela", "VSR", "COVID-19"]) {
    assert.match(routine.join(" "), new RegExp(expected, "i"));
  }
  for (const expected of ["Hepatite A", "Meningocócica", "Tríplice viral"]) {
    assert.match(special.join(" "), new RegExp(expected, "i"));
  }
  assert.doesNotMatch(all, /dengue/i);
  assert.ok(GERIATRIC_VACCINE_CHECKLIST.every((item) => item.note.trim().length > 0));
});

test("marcar ao menos uma vacina pendente deriva status PENDING sem expor o código interno no relatório", () => {
  const review = deriveVaccinationReview({
    reviewed: true,
    pendingVaccines: ["Influenza (gripe)", "Pneumocócica conjugada VPC20"],
  });
  assert.equal(review.status, "PENDING");
  assert.deepEqual(review.pendingVaccines, ["Influenza (gripe)", "Pneumocócica conjugada VPC20"]);

  const section = buildVaccinationPreventionSection(review);
  assert.equal(section.status, "PENDING");
  assert.equal(section.statusLabel, "Há vacinas pendentes registradas");
  assert.doesNotMatch(section.statusLabel, /PENDING|UNKNOWN|UP_TO_DATE/i);
  assert.deepEqual(section.pendingVaccines, ["Influenza (gripe)", "Pneumocócica conjugada VPC20"]);
  assert.equal(section.automaticPrescription, false);
  assert.doesNotMatch(section.guidance.join(" "), /aplicar|administrar|prescrever/i);
});

test("carteira revisada sem pendência deriva UP_TO_DATE e usa texto compreensível", () => {
  const review = deriveVaccinationReview({ reviewed: true, pendingVaccines: [] });
  assert.deepEqual(review, { status: "UP_TO_DATE" });
  const section = buildVaccinationPreventionSection(review);
  assert.equal(section.status, "UP_TO_DATE");
  assert.match(section.statusLabel, /nenhuma vacina pendente/i);
  assert.doesNotMatch(section.statusLabel, /UP_TO_DATE/i);
});

test("carteira não revisada e sem pendências permanece UNKNOWN com orientação clara", () => {
  const review = deriveVaccinationReview({ reviewed: false, pendingVaccines: [] });
  assert.deepEqual(review, { status: "UNKNOWN" });
  const section = buildVaccinationPreventionSection(review);
  assert.equal(section.status, "UNKNOWN");
  assert.equal(section.statusLabel, "Carteira de vacinação ainda não revisada");
  assert.deepEqual(section.pendingVaccines, []);
  assert.match(section.guidance.join(" "), /carteira de vacinação.*revisão/i);
  assert.match(section.guidance.join(" "), /não considera nenhuma vacina como pendente/i);
  assert.doesNotMatch(section.statusLabel, /UNKNOWN/i);
});

test("vacinas pendentes são normalizadas sem criar prescrição automática", () => {
  const section = buildVaccinationPreventionSection({
    status: "PENDING",
    pendingVaccines: ["Influenza", "  Pneumocócica  ", "influenza"],
  });

  assert.equal(section.status, "PENDING");
  assert.deepEqual(section.pendingVaccines, ["Influenza", "Pneumocócica"]);
  assert.equal(section.automaticPrescription, false);
});

test("revisão vacinal rejeita status pendente sem nome e pendência incompatível", () => {
  assert.throws(
    () => normalizeVaccinationReview({ status: "PENDING", pendingVaccines: [] }),
    /ao menos uma vacina/,
  );
  assert.throws(
    () => normalizeVaccinationReview({ status: "UP_TO_DATE", pendingVaccines: ["Influenza"] }),
    /só podem ser registradas/,
  );
  assert.throws(
    () => normalizeVaccinationReview({ status: "PENDING", pendingVaccines: ["Aplicar influenza hoje"] }),
    /somente o nome da vacina/,
  );
});
