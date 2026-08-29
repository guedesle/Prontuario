import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/app/page.tsx", "utf8");
const consultationPage = readFileSync("src/app/consultations/[id]/page.tsx", "utf8");
const reportTabs = readFileSync("src/components/reports/report-workspace-tabs.tsx", "utf8");
const report = readFileSync("src/components/reports/aga-report-document-preview.tsx", "utf8");
const medicationPrint = readFileSync("src/app/consultations/[id]/medications/print/page.tsx", "utf8");
const medicationDocument = readFileSync("src/server/clinical/medication-plan-document.ts", "utf8");

const ownerOnlyPattern = /Dra\. Natalia Mendes|CRM-BA 27416|RQE 24673|natalia-mendes-logo\.svg/;

test("superfícies ativas não carregam identidade fixa da proprietária", () => {
  assert.doesNotMatch(home, ownerOnlyPattern);
  assert.doesNotMatch(consultationPage, ownerOnlyPattern);
  assert.doesNotMatch(report, ownerOnlyPattern);
  assert.doesNotMatch(medicationPrint, ownerOnlyPattern);
});

test("identidade profissional vem da sessão e percorre relatório e impressão", () => {
  assert.match(home, /buildProfessionalIdentity/);
  assert.match(home, /user\.name/);
  assert.match(home, /user\.email/);
  assert.match(consultationPage, /professionalIdentity/);
  assert.match(reportTabs, /professionalIdentity: ProfessionalIdentity/);
  assert.match(report, /professionalIdentity\.displayName/);
  assert.match(report, /professionalIdentity\.logoPath \?/);
  assert.match(report, /identity\.registrationLine \?/);
  assert.match(medicationDocument, /professionalIdentity: ProfessionalIdentity/);
  assert.match(medicationDocument, /buildProfessionalIdentity/);
  assert.match(medicationPrint, /document\.professionalIdentity/);
  assert.match(medicationPrint, /professionalIdentity\.registrationLine \?/);
});
