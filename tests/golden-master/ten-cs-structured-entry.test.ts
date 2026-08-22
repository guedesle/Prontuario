import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  TEN_CS_STRUCTURED_DEFINITION,
  TEN_CS_STRUCTURED_VERSION,
  scoreTenCsStructured,
} from "../../src/domain/ten-cs-structured.ts";

test("10-CS estruturado substitui o campo único por componentes clínicos", () => {
  assert.equal(TEN_CS_STRUCTURED_DEFINITION.fields.some((field) => field.id === "score"), false);
  assert.deepEqual(TEN_CS_STRUCTURED_DEFINITION.fields.map((field) => field.id), [
    "orientationYear",
    "orientationMonth",
    "orientationDate",
    "animalFluency",
    "recall1",
    "recall2",
    "recall3",
    "educationAdjustment",
  ]);
  assert.equal("applicationGuide" in TEN_CS_STRUCTURED_DEFINITION, false);
});

test("10-CS soma orientação, fluência e evocação e aplica ajuste educacional", () => {
  const result = scoreTenCsStructured({
    orientationYear: 1,
    orientationMonth: 1,
    orientationDate: 1,
    animalFluency: 2,
    recall1: 1,
    recall2: 0,
    recall3: 1,
    educationAdjustment: 1,
  });
  assert.equal(result.result.score, 8);
  assert.equal(result.result.classification, "Normal");
  assert.equal(result.version, TEN_CS_STRUCTURED_VERSION);
});

test("10-CS-Edu limita o resultado ajustado a 10 pontos", () => {
  const result = scoreTenCsStructured({
    orientationYear: 1,
    orientationMonth: 1,
    orientationDate: 1,
    animalFluency: 4,
    recall1: 1,
    recall2: 1,
    recall3: 1,
    educationAdjustment: 2,
  });
  assert.equal(result.result.score, 10);
});

test("10-CS falha fechado para valores ou campos não permitidos", () => {
  assert.throws(() => scoreTenCsStructured({
    orientationYear: 2,
    orientationMonth: 1,
    orientationDate: 1,
    animalFluency: 4,
    recall1: 1,
    recall2: 1,
    recall3: 1,
    educationAdjustment: 0,
  }), /orientationYear/);

  assert.throws(() => scoreTenCsStructured({
    orientationYear: 1,
    orientationMonth: 1,
    orientationDate: 1,
    animalFluency: 4,
    recall1: 1,
    recall2: 1,
    recall3: 1,
    educationAdjustment: 0,
    score: 10,
  }), /campo não permitido/);
});

test("endpoint complementar publica e pontua a definição estruturada do 10-CS", () => {
  const route = readFileSync("src/app/api/consultations/[id]/scales/complementary/route.ts", "utf8");
  assert.match(route, /TEN_CS_STRUCTURED_DEFINITION/);
  assert.match(route, /scoreTenCsStructured/);
  assert.match(route, /item\.code === TEN_CS_STRUCTURED_CODE \? TEN_CS_STRUCTURED_DEFINITION : item/);
});
