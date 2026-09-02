import assert from "node:assert/strict";
import test from "node:test";
import { calculateCarg, calculateG8 } from "../../src/domain/oncogeriatria/calculators.ts";
import { buildOncogeriatricDelta } from "../../src/domain/oncogeriatria/longitudinal.ts";

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

test("CARG original: cenário sem fatores pontua zero e risco baixo", () => {
  const result = calculateCarg({
    ageYears: 70,
    sex: "FEMALE",
    cancerType: "OTHER",
    plannedDose: "REDUCED_UPFRONT",
    plannedDrugCount: "MONO",
    hemoglobinGdl: 12,
    creatinineClearanceMlMin: 60,
    hearing: "EXCELLENT_GOOD",
    fallsLastSixMonths: 0,
    medicationIndependence: "WITHOUT_HELP",
    walkingLimitation: "NOT_LIMITED",
    socialInterference: "NONE_OR_LITTLE",
  });
  assert.equal(result.score, 0);
  assert.equal(result.category, "LOW");
});

test("CARG original: soma máxima é 23 e permanece categoria alta", () => {
  const result = calculateCarg({
    ageYears: 80,
    sex: "MALE",
    cancerType: "GI_GU",
    plannedDose: "STANDARD",
    plannedDrugCount: "POLY",
    hemoglobinGdl: 9,
    creatinineClearanceMlMin: 20,
    hearing: "FAIR_POOR_DEAF",
    fallsLastSixMonths: 2,
    medicationIndependence: "WITH_HELP_OR_UNABLE",
    walkingLimitation: "SOMEWHAT_OR_A_LOT",
    socialInterference: "SOME_MOST_ALL",
  });
  assert.equal(result.score, 23);
  assert.equal(result.category, "HIGH");
  assert.match(result.decisionSupportMessage, /apoio à decisão clínica compartilhada/i);
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
