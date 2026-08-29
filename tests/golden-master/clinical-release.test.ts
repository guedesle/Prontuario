import assert from "node:assert/strict";
import test from "node:test";
import { CLINICAL_RELEASE_ID } from "../../src/domain/clinical-release.ts";

test("release clínica possui identificador estável e não vazio para o smoke de produção", () => {
  assert.equal(CLINICAL_RELEASE_ID, "2026-08-29-fast7c-gtt-functional-cam-lace-v1");
  assert.ok(CLINICAL_RELEASE_ID.length > 10);
});
