import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../../src/components/reports/aga-report-preview.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../../src/app/clinical-report.css", import.meta.url), "utf8");
const reportDomain = readFileSync(new URL("../../src/domain/aga-report.ts", import.meta.url), "utf8");

const removedMultidisciplinaryBlock = /O que registrar para discutir com a equipe multidisciplinar/i;

test("impressão nativa reflete a confirmação local de revisão clínica", () => {
  assert.match(component, /data-clinical-review=\{clinicalReviewConfirmed \? "confirmed" : "pending"\}/);
  assert.match(component, /Relatório não liberado para impressão — revisão clínica pendente\./);
  assert.match(component, /disabled=\{!generated \|\| !clinicalReviewConfirmed\}/);
  assert.match(component, /Confirmo que revisei problemas, resultados, alertas e sugestões deste relatório\./);
});

test("CSS de impressão oculta o relatório pendente e mostra somente o bloqueio", () => {
  assert.match(stylesheet, /@media print/);
  assert.match(stylesheet, /\.consultation-shell > \*\s*\{\s*display: none !important;/);
  assert.match(stylesheet, /\.report-workspace\[data-clinical-review="pending"\] > \*\s*\{\s*display: none !important;/);
  assert.match(stylesheet, /\.report-workspace\[data-clinical-review="pending"\] > \.print-review-blocker\s*\{\s*display: block !important;/);
});

test("tabela final de medicamentos possui impressão isolada após revisão", () => {
  assert.match(component, /Imprimir tabela de medicamentos/);
  assert.match(component, /data-print-scope=\{printMedicationOnly \? "medications" : "report"\}/);
  assert.match(component, /generated\.report\.medicationPlan\.status !== "READY"/);
  assert.match(stylesheet, /data-print-scope="medications"/);
  assert.match(stylesheet, /\.aga-report > \.medication-final-section/);
});

test("bloco multidisciplinar removido não reaparece no relatório visual nem no texto exportado", () => {
  assert.doesNotMatch(component, removedMultidisciplinaryBlock);
  assert.doesNotMatch(reportDomain, removedMultidisciplinaryBlock);
});
