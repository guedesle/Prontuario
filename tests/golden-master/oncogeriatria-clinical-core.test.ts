import assert from "node:assert/strict";
import test from "node:test";
import { buildOncogeriatricCapacityHistory, latestOncogeriatricDomainStates } from "../../src/domain/oncogeriatria/capacity-history.ts";
import { calculateG8, cargAvailability } from "../../src/domain/oncogeriatria/calculators.ts";
import { buildOncogeriatricDelta, latestRecoveryAssessmentsByDomain } from "../../src/domain/oncogeriatria/longitudinal.ts";

test("G8 original: cenário máximo resulta 17 e triagem não vulnerável", () => {
  const result = calculateG8({
    foodIntake: "NO_DECREASE",
    weightLoss: "NONE",
    mobility: "GOES_OUT",
    neuropsychological: "NONE",
    bmi: 24,
    takesMoreThanThreePrescriptionDrugs: false,
    healthStatusComparedWithPeers: "BETTER",
    ageYears: 79,
  });
  assert.equal(result.score, 17);
  assert.equal(result.classification, "NOT_VULNERABLE_SCREEN");
  assert.equal(result.cutoff, 14);
});

test("G8 original: cutoff 14 permanece triagem vulnerável", () => {
  const result = calculateG8({
    foodIntake: "NO_DECREASE",
    weightLoss: "NONE",
    mobility: "GOES_OUT",
    neuropsychological: "NONE",
    bmi: 23,
    takesMoreThanThreePrescriptionDrugs: true,
    healthStatusComparedWithPeers: "SAME",
    ageYears: 82,
  });
  assert.equal(result.score, 14);
  assert.equal(result.classification, "VULNERABLE_SCREEN");
});

test("CARG permanece bloqueado quando licenciamento eletrônico não está resolvido", () => {
  const availability = cargAvailability();
  assert.equal(availability.status, "LICENSE_REVIEW_REQUIRED");
  assert.match(availability.message, /licenciamento/i);
});

test("delta geriátrico nunca mistura versões diferentes", () => {
  const sameVersion = buildOncogeriatricDelta([
    { code: "MNA_SF", version: "1", occurredAt: new Date("2026-01-01"), value: 13 },
    { code: "MNA_SF", version: "1", occurredAt: new Date("2026-04-01"), value: 9 },
  ]);
  assert.deepEqual(sameVersion && { baseline: sameVersion.baseline, current: sameVersion.current, delta: sameVersion.delta }, { baseline: 13, current: 9, delta: -4 });

  const mixed = buildOncogeriatricDelta([
    { code: "MNA_SF", version: "1", occurredAt: new Date("2026-01-01"), value: 13 },
    { code: "MNA_SF", version: "2", occurredAt: new Date("2026-04-01"), value: 9 },
  ]);
  assert.equal(mixed, null);
});

test("relatório pós-tratamento usa a avaliação de recuperação mais recente de cada domínio", () => {
  const latest = latestRecoveryAssessmentsByDomain([
    { id: "functional-new", domain: "FUNCTIONAL", assessedAt: new Date("2026-08-01"), status: "RECOVERING" },
    { id: "nutrition-new", domain: "NUTRITION", assessedAt: new Date("2026-07-15"), status: "RECOVERED" },
    { id: "functional-old", domain: "FUNCTIONAL", assessedAt: new Date("2026-06-01"), status: "PERSISTENT_DEFICIT" },
  ]);
  assert.equal(latest.length, 2);
  assert.equal(latest.find((item) => item.domain === "FUNCTIONAL")?.id, "functional-new");
  assert.equal(latest.find((item) => item.domain === "NUTRITION")?.id, "nutrition-new");
});

test("trajetória por domínio da Oncogeriatria inclui somente consultas explicitamente vinculadas ao episódio", () => {
  const patientId = "patient-1";
  const history = buildOncogeriatricCapacityHistory({
    patientId,
    checkpoints: [{ consultationId: "consultation-linked" }],
    consultations: [
      { id: "consultation-linked", patientId, occurredAt: "2026-01-10" },
      { id: "consultation-unrelated", patientId, occurredAt: "2026-02-10" },
    ],
    assessments: [
      {
        id: "lawton-linked",
        patientId,
        consultationId: "consultation-linked",
        scaleCode: "lawton",
        scaleVersion: "v1",
        scoreNumeric: 18,
        scoreText: "18",
        classification: "dependência funcional",
        clinicalColor: "vermelho",
        appliedAt: "2026-01-10",
      },
      {
        id: "lawton-unrelated",
        patientId,
        consultationId: "consultation-unrelated",
        scaleCode: "lawton",
        scaleVersion: "v1",
        scoreNumeric: 27,
        scoreText: "27",
        classification: "independente",
        clinicalColor: "verde",
        appliedAt: "2026-02-10",
      },
    ],
  });

  assert.deepEqual(history.consultations.map((item) => item.id), ["consultation-linked"]);
  const functional = history.dimensions.find((item) => item.code === "funcionalidade");
  assert.equal(functional?.cells.length, 1);
  assert.equal(functional?.cells[0]?.status, "altered");
  assert.equal(functional?.cells[0]?.assessments[0]?.assessmentId, "lawton-linked");
});

test("último estado oncogeriátrico por domínio persiste quando checkpoint posterior não reaplica escala", () => {
  const patientId = "patient-2";
  const history = buildOncogeriatricCapacityHistory({
    patientId,
    checkpoints: [
      { consultationId: "baseline" },
      { consultationId: "cycle-2" },
    ],
    consultations: [
      { id: "baseline", patientId, occurredAt: "2026-03-01" },
      { id: "cycle-2", patientId, occurredAt: "2026-04-01" },
    ],
    assessments: [
      {
        id: "lawton-baseline",
        patientId,
        consultationId: "baseline",
        scaleCode: "lawton",
        scaleVersion: "v1",
        scoreNumeric: 20,
        scoreText: "20",
        classification: "dependência funcional",
        clinicalColor: "vermelho",
        appliedAt: "2026-03-01",
      },
    ],
  });

  const functional = history.dimensions.find((item) => item.code === "funcionalidade");
  assert.equal(functional?.cells[0]?.status, "altered");
  assert.equal(functional?.cells[1]?.status, "not-assessed");

  const latest = latestOncogeriatricDomainStates(history).find((item) => item.code === "funcionalidade");
  assert.equal(latest?.status, "altered");
  assert.equal(latest?.occurredAt?.slice(0, 10), "2026-03-01");
  assert.equal(latest?.instruments[0]?.code, "lawton");
});