import assert from "node:assert/strict";
import test from "node:test";
import { calculateG8, cargAvailability } from "../../src/domain/oncogeriatria/calculators.ts";
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
