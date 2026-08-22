import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("family report keeps medication table as final report section with isolated print action", () => {
  const source = readFileSync("src/components/reports/aga-report-preview.tsx", "utf8");
  const medicationIndex = source.indexOf("medication-final-section");
  const footerIndex = source.indexOf("care-report-footer");
  assert.ok(medicationIndex > 0);
  assert.ok(footerIndex > medicationIndex);
  assert.match(source, /Imprimir tabela de medicações/);
  assert.match(source, /data-print-scope/);
  assert.match(source, /printMedicationOnly/);
});

test("medication table exposes route checkboxes, daily moments, usage and safety disclaimer", () => {
  const source = readFileSync("src/components/reports/aga-report-preview.tsx", "utf8");
  assert.match(source, /type="checkbox" checked=\{routes\.oral\}/);
  assert.match(source, /> Oral<\/label>/);
  assert.match(source, /> SNE<\/label>/);
  assert.match(source, /> GTT<\/label>/);
  assert.match(source, /MEDICATION_MOMENTS\.map/);
  assert.match(source, /Tipo de uso/);
  assert.match(source, /Uso contínuo/);
  assert.match(source, /Temporário/);
  assert.match(source, /Se necessário/);
  assert.match(source, /não substitui a receita médica/);
  assert.match(source, /não autoriza iniciar, suspender, substituir ou alterar medicamentos por conta própria/);
});

test("report review gate remains mandatory for print and export", () => {
  const source = readFileSync("src/components/reports/aga-report-preview.tsx", "utf8");
  assert.match(source, /Confirmo que revisei problemas, resultados, alertas e sugestões deste relatório\./);
  assert.match(source, /disabled=\{!generated \|\| !clinicalReviewConfirmed\}/);
  assert.match(source, /if \(!generated \|\| !clinicalReviewConfirmed\) return/);
});

test("removed multidisciplinary discussion block does not return", () => {
  const source = readFileSync("src/components/reports/aga-report-preview.tsx", "utf8");
  assert.doesNotMatch(source, /O que registrar para discutir com a equipe multidisciplinar/);
});
