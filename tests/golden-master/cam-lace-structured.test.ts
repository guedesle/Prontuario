import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CAM_STRUCTURED_DEFINITION,
  CAM_STRUCTURED_VERSION,
  LACE_STRUCTURED_DEFINITION,
  LACE_STRUCTURED_VERSION,
  scoreCamStructured,
  scoreLaceStructured,
} from "../../src/domain/cam-lace-structured.ts";

test("CAM usa quatro características estruturadas e aplica o algoritmo automaticamente", () => {
  assert.equal(CAM_STRUCTURED_DEFINITION.fields.length, 4);
  assert.ok(CAM_STRUCTURED_DEFINITION.fields.every((field) => field.choices.length === 2));
  assert.equal(CAM_STRUCTURED_DEFINITION.fields.map((field) => String(field.id)).includes("status"), false);

  const positive = scoreCamStructured({
    acuteOrFluctuating: 1,
    inattention: 1,
    disorganizedThinking: 1,
    alteredConsciousness: 0,
  });
  assert.equal(positive.result.score, 1);
  assert.match(positive.result.scoreText, /positivo/i);
  assert.equal(positive.result.clinicalColor, "vermelho");
  assert.equal(positive.version, CAM_STRUCTURED_VERSION);

  const negative = scoreCamStructured({
    acuteOrFluctuating: 1,
    inattention: 0,
    disorganizedThinking: 1,
    alteredConsciousness: 1,
  });
  assert.equal(negative.result.score, 0);
  assert.match(negative.result.scoreText, /negativo/i);
});

test("LACE usa L A C E estruturados e calcula o total sem digitação manual do escore", () => {
  assert.equal(LACE_STRUCTURED_DEFINITION.fields.length, 4);
  assert.ok(LACE_STRUCTURED_DEFINITION.fields.every((field) => field.choices.length >= 2));
  assert.equal(LACE_STRUCTURED_DEFINITION.fields.map((field) => String(field.id)).includes("score"), false);

  const scored = scoreLaceStructured({
    lengthOfStayPoints: 7,
    acuteAdmissionPoints: 3,
    charlsonPoints: 5,
    emergencyVisitPoints: 4,
  });
  assert.equal(scored.result.score, 19);
  assert.equal(scored.result.scoreText, "19/19");
  assert.match(scored.result.classification, /alto risco/i);
  assert.equal(scored.version, LACE_STRUCTURED_VERSION);
});

test("endpoint publica e pontua CAM e LACE estruturados antes do fallback legado", () => {
  const route = readFileSync("src/app/api/consultations/[id]/scales/complementary/route.ts", "utf8");
  for (const token of [
    "CAM_STRUCTURED_DEFINITION",
    "LACE_STRUCTURED_DEFINITION",
    "scoreCamStructured",
    "scoreLaceStructured",
  ]) assert.match(route, new RegExp(token));
});
