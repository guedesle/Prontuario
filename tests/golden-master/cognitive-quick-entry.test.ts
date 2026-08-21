import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_QUICK_DEFINITIONS,
  scoreCognitiveQuickEntry,
} from "../../src/domain/cognitive-quick-entry.ts";

test("simplified MEEM and MoCA require score plus complete education years", () => {
  for (const definition of COGNITIVE_QUICK_DEFINITIONS) {
    assert.deepEqual(definition.fields.map((field) => field.id), ["score", "educationYears"]);
    assert.match(definition.sourceNote, /PMID/);
    assert.match(definition.sourceNote, /não estabelece diagnóstico|não pontos diagnósticos/i);
  }
});

test("MEEM uses Brucki medians only as contextual education references", () => {
  const cases = [
    [0, 20], [4, 25], [5, 26.5], [8, 26.5], [9, 28], [11, 28], [12, 29], [20, 29],
  ] as const;
  for (const [educationYears, median] of cases) {
    const result = scoreCognitiveQuickEntry("meem", { score: 24, educationYears });
    assert.equal(result.result.score, 24);
    assert.equal(result.result.clinicalColor, "cinza");
    assert.match(result.result.classification, /contextual/i);
    assert.match(result.result.interpretation, new RegExp(String(median).replace(".", "\\.")));
    assert.match(result.result.interpretation, /não constitui ponto diagnóstico/i);
  }
});

test("MoCA applies +1 at <=12 years, caps at 30 and stores raw result in answers", () => {
  const capped = scoreCognitiveQuickEntry("moca", { score: 30, educationYears: 12 });
  assert.equal(capped.answers.score, 30);
  assert.equal(capped.result.score, 30);
  assert.match(capped.result.scoreText, /Bruto 30\/30 · corrigido 30\/30/);

  const noCorrection = scoreCognitiveQuickEntry("moca", { score: 19, educationYears: 13 });
  assert.equal(noCorrection.result.score, 19);
  assert.match(noCorrection.result.interpretation, /correção educacional \+0/);
});

test("MoCA does not generate an automatic cutoff below four education years", () => {
  const result = scoreCognitiveQuickEntry("moca", { score: 10, educationYears: 3 });
  assert.equal(result.result.clinicalColor, "cinza");
  assert.match(result.result.classification, /sem ponto de corte automático/i);
  assert.doesNotMatch(result.result.classification, /demência|diagnóstico/i);
});

test("MoCA educational boundary behavior is explicit and conservative", () => {
  const below4to12 = scoreCognitiveQuickEntry("moca", { score: 19, educationYears: 4 });
  const at4to12 = scoreCognitiveQuickEntry("moca", { score: 20, educationYears: 12 });
  const belowHigher = scoreCognitiveQuickEntry("moca", { score: 19, educationYears: 13 });
  const atHigher = scoreCognitiveQuickEntry("moca", { score: 20, educationYears: 13 });
  assert.equal(below4to12.result.score, 20);
  assert.equal(below4to12.result.clinicalColor, "amarelo");
  assert.equal(at4to12.result.score, 21);
  assert.equal(at4to12.result.clinicalColor, "verde");
  assert.equal(belowHigher.result.clinicalColor, "amarelo");
  assert.equal(atHigher.result.clinicalColor, "verde");
  for (const item of [below4to12, at4to12, belowHigher, atHigher]) {
    assert.match(item.result.interpretation, /não estabelece diagnóstico/i);
  }
});

test("cognitive quick entry rejects out-of-range and non-integer input", () => {
  assert.throws(() => scoreCognitiveQuickEntry("meem", { score: 31, educationYears: 4 }), /inválido/i);
  assert.throws(() => scoreCognitiveQuickEntry("moca", { score: 20.5, educationYears: 4 }), /inválido/i);
  assert.throws(() => scoreCognitiveQuickEntry("moca", { score: 20, educationYears: 4.5 }), /inválido/i);
});
