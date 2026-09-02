import assert from "node:assert/strict";
import test from "node:test";
import { ageOnDate, isProgram55Eligible } from "../../src/domain/program55/eligibility.ts";

const reference = new Date("2026-09-02T12:00:00.000Z");

test("Programa 55+ inclui pacientes de 55 a 70 anos inclusive", () => {
  assert.equal(isProgram55Eligible(new Date("1971-09-02T00:00:00.000Z"), reference), true);
  assert.equal(isProgram55Eligible(new Date("1956-09-02T00:00:00.000Z"), reference), true);
  assert.equal(ageOnDate(new Date("1956-09-03T00:00:00.000Z"), reference), 69);
});

test("Programa 55+ exclui menores de 55, maiores de 70 e data ausente", () => {
  assert.equal(isProgram55Eligible(new Date("1971-09-03T00:00:00.000Z"), reference), false);
  assert.equal(isProgram55Eligible(new Date("1955-09-02T00:00:00.000Z"), reference), false);
  assert.equal(isProgram55Eligible(null, reference), false);
});
