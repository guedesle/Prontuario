import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_QUICK_DEFINITIONS,
  MEEM_EDUCATION_BANDS,
  scoreCognitiveQuickEntry,
} from "../../src/domain/cognitive-quick-entry.ts";

test("MEEM uses the requested schooling list while MoCA keeps complete education years", () => {
  const meem = COGNITIVE_QUICK_DEFINITIONS.find((definition) => definition.code === "meem");
  const moca = COGNITIVE_QUICK_DEFINITIONS.find((definition) => definition.code === "moca");
  assert.ok(meem);
  assert.ok(moca);
  assert.deepEqual(meem.fields.map((field) => field.id), ["score", "educationBand"]);
  assert.deepEqual(moca.fields.map((field) => field.id), ["score", "educationYears"]);
  assert.deepEqual(MEEM_EDUCATION_BANDS.map((item) => item.label), ["0–4 anos", "4–11 anos", "> 11 anos"]);
  assert.match(meem.sourceNote, /PMID 29213658/);
  assert.match(meem.sourceNote, /padronização operacional|mapeamento operacional/i);
  assert.match(meem.instruction, /nunca como diagnóstico isolado/i);
  assert.match(moca.sourceNote, /PMID 31043963/);
  assert.match(moca.sourceNote, /não estabelece diagnóstico/i);
});

test("MEEM validates an altered result as cognitive alteration in the screening context", () => {
  const cases = [
    { band: "0_4", below: 21, at: 22, label: "0–4 anos" },
    { band: "4_11", below: 22, at: 23, label: "4–11 anos" },
    { band: "gt_11", below: 23, at: 24, label: "> 11 anos" },
  ] as const;

  for (const item of cases) {
    const altered = scoreCognitiveQuickEntry("meem", { score: item.below, educationBand: item.band });
    assert.equal(altered.answers.educationBand, item.band);
    assert.equal(altered.result.clinicalColor, "amarelo");
    assert.match(altered.result.classification, /alteração cognitiva/i);
    assert.match(altered.result.interpretation, /alteração cognitiva no rastreio/i);
    assert.match(altered.result.interpretation, /não estabelece diagnóstico isoladamente/i);
    assert.match(altered.result.scoreText, new RegExp(item.label.replace(/[–>]/g, (value) => value === "–" ? "–" : ">")));

    const preserved = scoreCognitiveQuickEntry("meem", { score: item.at, educationBand: item.band });
    assert.equal(preserved.result.clinicalColor, "verde");
    assert.match(preserved.result.classification, /sem alteração cognitiva/i);
  }
});

test("MEEM accepts legacy complete education years without changing the new persisted band", () => {
  assert.equal(scoreCognitiveQuickEntry("meem", { score: 22, educationYears: 4 }).answers.educationBand, "0_4");
  assert.equal(scoreCognitiveQuickEntry("meem", { score: 23, educationYears: 5 }).answers.educationBand, "4_11");
  assert.equal(scoreCognitiveQuickEntry("meem", { score: 24, educationYears: 12 }).answers.educationBand, "gt_11");
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

test("cognitive quick entry rejects invalid MEEM bands and out-of-range input", () => {
  assert.throws(() => scoreCognitiveQuickEntry("meem", { score: 31, educationBand: "0_4" }), /inválid[oa]/i);
  assert.throws(() => scoreCognitiveQuickEntry("meem", { score: 22, educationBand: "invalid" }), /inválid[oa]/i);
  assert.throws(() => scoreCognitiveQuickEntry("moca", { score: 20.5, educationYears: 4 }), /inválid[oa]/i);
  assert.throws(() => scoreCognitiveQuickEntry("moca", { score: 20, educationYears: 4.5 }), /inválid[oa]/i);
});
