import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertPatientSearchQuery,
  PATIENT_SEARCH_LIMIT,
  toPatientSelectionResult,
} from "../../src/domain/patient-search.ts";

test("busca de paciente normaliza acentos, caixa e espaços e exige dois caracteres", () => {
  assert.equal(assertPatientSearchQuery("  MÁria   da SILVA  "), "maria da silva");
  assert.equal(assertPatientSearchQuery("Ál"), "al");
  assert.throws(
    () => assertPatientSearchQuery(" a "),
    /pelo menos 2 caracteres/i,
  );
});

test("resultado de seleção expõe somente dados mínimos para diferenciar o paciente", () => {
  const result = toPatientSelectionResult({
    id: "patient-synthetic-1",
    fullName: " Paciente   Sintético ",
    birthDate: new Date("1940-01-02T12:00:00.000Z"),
    needsIdentityReview: true,
  });

  assert.deepEqual(result, {
    id: "patient-synthetic-1",
    fullName: "Paciente Sintético",
    birthDate: "1940-01-02",
    needsIdentityReview: true,
  });
  assert.deepEqual(Object.keys(result).sort(), ["birthDate", "fullName", "id", "needsIdentityReview"]);
});

test("serviço de busca exige patient.read, limita resultados e não seleciona identificadores sensíveis", () => {
  const source = readFileSync(
    new URL("../../src/server/patients/search-patients.ts", import.meta.url),
    "utf8",
  );

  assert.equal(PATIENT_SEARCH_LIMIT, 8);
  assert.match(source, /requireAuthenticatedUser\("patient\.read"\)/);
  assert.match(source, /take:\s*PATIENT_SEARCH_LIMIT/);
  assert.doesNotMatch(source, /phone:\s*true/);
  assert.doesNotMatch(source, /caregiverPhone:\s*true/);
  assert.doesNotMatch(source, /identifiers:\s*true/);
});
