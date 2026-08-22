import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const report = readFileSync("src/components/reports/aga-report-preview.tsx", "utf8");
const branding = readFileSync("src/app/report-branding.css", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");
const logo = readFileSync("public/brand/natalia-mendes-logo.svg", "utf8");

test("relatório usa o título e a identificação profissional aprovados", () => {
  assert.match(report, /Relatório Longitudinal de Saúde e Funcionalidade/);
  assert.match(report, /Avaliação Geriátrica Ampla/);
  assert.match(report, /Dra\. Natalia Mendes/);
  assert.match(report, /CRM-BA: 27416 · RQE: 24673/);
  assert.match(report, /signature-line/);
});

test("logo oficial aparece no topo e a assinatura contém apenas identificação profissional", () => {
  assert.match(report, /\/brand\/natalia-mendes-logo\.svg/);
  assert.match(report, /<BrandLogo \/>/);
  const signatureComponent = report.slice(
    report.indexOf("function PhysicianSignature"),
    report.indexOf("function BrandLogo"),
  );
  assert.doesNotMatch(signatureComponent, /BrandLogo|report-brand-logo/);
  assert.match(signatureComponent, /Dra\. Natalia Mendes/);
  assert.match(signatureComponent, /CRM-BA: 27416 · RQE: 24673/);
  assert.match(logo, /Natalia Mendes Médica Geriatra/);
});

test("relatório e tabela de medicações preservam ações de impressão separadas após revisão", () => {
  assert.match(report, /function printReport\(\)/);
  assert.match(report, /clinicalReviewConfirmed/);
  assert.match(report, />Imprimir relatório<\/button>/);
  assert.match(report, /function printMedicationPlan\(\)/);
  assert.match(report, /setPrintMedicationOnly\(true\)/);
  assert.match(report, />Imprimir tabela de medicações<\/button>/);
  assert.match(report, /data-print-scope=\{printMedicationOnly \? "medications" : "report"\}/);
});

test("impressão isolada da tabela recebe logo superior e assinatura própria", () => {
  assert.match(report, /medication-print-brand/);
  assert.match(report, /<PhysicianSignature medicationOnly \/>/);
  assert.match(branding, /data-print-scope="medications"[^}]*\.medication-print-brand/);
  assert.match(branding, /data-print-scope="medications"[^}]*\.medication-only-signature/);
});

test("CSS de branding é carregado depois do CSS clínico", () => {
  const clinicalIndex = layout.indexOf('import "./clinical-report.css";');
  const brandingIndex = layout.indexOf('import "./report-branding.css";');
  assert.ok(clinicalIndex >= 0);
  assert.ok(brandingIndex > clinicalIndex);
});
