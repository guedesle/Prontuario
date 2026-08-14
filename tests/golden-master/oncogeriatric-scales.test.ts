import test from "node:test";
import assert from "node:assert/strict";
import { scoreCrashMnaSf, scoreEcog } from "../../src/domain/oncogeriatric-scales.ts";

test("ECOG preserva os graus oficiais de 0 a 5", () => {
  assert.equal(scoreEcog(0).scoreText, "ECOG 0");
  assert.equal(scoreEcog(4).score, 4);
  assert.equal(scoreEcog(5).texto, "Morto.");
  assert.equal(scoreEcog(6).score, null);
});

test("CRASH adaptada calcula cenário de menor risco", () => {
  const result = scoreCrashMnaSf({ chemotherapyRisk: 0, diastolicBloodPressure: 72, iadlScore: 26, ldh: 459, ecog: 0, mmseScore: 30, mnaSfScore: 12 });
  assert.equal(result.hematologicScore, 0);
  assert.equal(result.nonHematologicScore, 0);
  assert.equal(result.combinedScore, 0);
  assert.equal(result.combinedCategory, "Baixo");
  assert.equal(result.localAdaptation, true);
});

test("CRASH adaptada aplica dois pontos quando MNA-SF é menor que 12", () => {
  const preserved = scoreCrashMnaSf({ chemotherapyRisk: 0, diastolicBloodPressure: 72, iadlScore: 26, ldh: 459, ecog: 0, mmseScore: 30, mnaSfScore: 12 });
  const altered = scoreCrashMnaSf({ chemotherapyRisk: 0, diastolicBloodPressure: 72, iadlScore: 26, ldh: 459, ecog: 0, mmseScore: 30, mnaSfScore: 11 });
  assert.equal(altered.nonHematologicScore - preserved.nonHematologicScore, 2);
});

test("CRASH adaptada preserva limites dos três escores e não conta Chemotox duas vezes", () => {
  const intermediate = scoreCrashMnaSf({ chemotherapyRisk: 2, diastolicBloodPressure: 73, iadlScore: 26, ldh: 459, ecog: 1, mmseScore: 30, mnaSfScore: 12 });
  assert.equal(intermediate.hematologicScore, 3);
  assert.equal(intermediate.nonHematologicScore, 3);
  assert.equal(intermediate.combinedScore, 4);
  assert.equal(intermediate.combinedCategory, "Intermediário-baixo");

  const high = scoreCrashMnaSf({ chemotherapyRisk: 2, diastolicBloodPressure: 73, iadlScore: 25, ldh: 460, ecog: 3, mmseScore: 29, mnaSfScore: 11 });
  assert.equal(high.hematologicScore, 6);
  assert.equal(high.nonHematologicScore, 8);
  assert.equal(high.combinedScore, 12);
  assert.equal(high.combinedCategory, "Alto");
});

test("CRASH adaptada rejeita valores fora da faixa versionada", () => {
  assert.throws(() => scoreCrashMnaSf({ chemotherapyRisk: 0, diastolicBloodPressure: 72, iadlScore: 26, ldh: 459, ecog: 0, mmseScore: 30, mnaSfScore: 15 }), /MNA-SF/);
});
