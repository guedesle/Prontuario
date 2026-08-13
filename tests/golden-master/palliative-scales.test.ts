import assert from "node:assert/strict";
import test from "node:test";
import { legacyScales } from "../../src/domain/legacy-scales.ts";

test("FAST preserva estágios e faixas do legado", () => {
  assert.equal(legacyScales.fast(1).cor, "verde");
  assert.equal(legacyScales.fast(3).cor, "amarelo");
  assert.equal(legacyScales.fast(4).classe, "Demência leve");
  assert.equal(legacyScales.fast(5).cor, "vermelho");
  assert.equal(legacyScales.fast(6.5).classe, "Demência moderadamente grave");
  assert.equal(legacyScales.fast(7.3).classe, "Demência grave");
  assert.equal(legacyScales.fast(7.6).cor, "vermelho");
  assert.equal(legacyScales.fast(6).cor, "cinza");
});

test("PPS aceita apenas dezenas e preserva faixas locais do legado", () => {
  assert.equal(legacyScales.pps(100).cor, "verde");
  assert.equal(legacyScales.pps(70).cor, "verde");
  assert.equal(legacyScales.pps(60).cor, "amarelo");
  assert.equal(legacyScales.pps(40).cor, "amarelo");
  assert.equal(legacyScales.pps(30).cor, "vermelho");
  assert.equal(legacyScales.pps(10).cor, "vermelho");
  assert.equal(legacyScales.pps(55).cor, "cinza");
});

test("ESAS preserva soma global e destaca sintomas individuais >=7", () => {
  const low = legacyScales.esas({ es1: 3, es2: 2, es3: 1 });
  assert.equal(low.score, 6);
  assert.equal(low.cor, "verde");
  assert.deepEqual(low.urgentSymptoms, []);

  const focal = legacyScales.esas({ es1: 7, es2: 0, es3: 0, es4: 0, es5: 0, es6: 0, es7: 0, es8: 0, es9: 0 });
  assert.equal(focal.score, 7);
  assert.equal(focal.cor, "verde");
  assert.deepEqual(focal.urgentSymptoms, ["es1"]);

  const high = legacyScales.esas({ es1: 10, es2: 10, es3: 10 });
  assert.equal(high.score, 30);
  assert.equal(high.cor, "vermelho");
  assert.equal(high.maxSymptomScore, 10);
});
