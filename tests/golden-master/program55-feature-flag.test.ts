import assert from "node:assert/strict";
import test from "node:test";
import { isProgram55Enabled } from "../../src/domain/program55/feature.ts";

test("Programa 55+ permanece habilitado por padrão", () => {
  assert.equal(isProgram55Enabled(undefined), true);
  assert.equal(isProgram55Enabled(""), true);
  assert.equal(isProgram55Enabled("false"), true);
  assert.equal(isProgram55Enabled("0"), true);
});

test("Programa 55+ só é ocultado por kill switch explícito", () => {
  assert.equal(isProgram55Enabled("true"), false);
  assert.equal(isProgram55Enabled(" TRUE "), false);
});
