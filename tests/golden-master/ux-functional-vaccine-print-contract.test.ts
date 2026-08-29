import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  soap: new URL("../../src/components/consultations/soap-editor.tsx", import.meta.url),
  consultationPage: new URL("../../src/app/consultations/[id]/page.tsx", import.meta.url),
  consultationWorkspace: new URL("../../src/components/consultations/consultation-workspace.tsx", import.meta.url),
  reportTabs: new URL("../../src/components/reports/report-workspace-tabs.tsx", import.meta.url),
  report: new URL("../../src/components/reports/aga-report-document-preview.tsx", import.meta.url),
};

async function text(url: URL): Promise<string> {
  return readFile(url, "utf8");
}

test("SOAP concentra plano e condutas em um único editor com revisão médica", async () => {
  const [soap, reportTabs] = await Promise.all([text(files.soap), text(files.reportTabs)]);

  assert.match(soap, /P — Plano e condutas/);
  assert.match(soap, /Plano e condutas em um só lugar/);
  assert.match(soap, /planByProblem/);
  assert.match(soap, /planSuggestions/);
  assert.match(soap, /Adicionar ao rascunho/);
  assert.match(soap, /requiresPhysicianReview/);
  assert.match(soap, /setProblemPlan/);
  assert.match(soap, /Salvar evolução e plano/);
  assert.match(soap, /Nada é aplicado automaticamente|nada é aplicado automaticamente/);
  assert.match(soap, /expectedNoteVersion/);
  assert.match(soap, /FINALIZED/);

  assert.match(reportTabs, /AgaReportDocumentPreview/);
  assert.doesNotMatch(reportTabs, /GeriatricConductWorkspace/);
  assert.doesNotMatch(reportTabs, /Condutas da consulta geriátrica/);
});

test("vacinas usam checklist organizado e não expõem campo livre de outras pendências", async () => {
  const soap = await text(files.soap);

  assert.match(soap, /Calendário de rotina do idoso/);
  assert.match(soap, /Situações especiais/);
  assert.match(soap, /Carteira\/status vacinal revisado nesta consulta/);
  assert.match(soap, /GERIATRIC_VACCINE_CHECKLIST/);
  assert.doesNotMatch(soap, /Outras pendências vacinais documentadas/);
  assert.doesNotMatch(soap, /otherPendingVaccinesText/);
  assert.match(soap, /legacyPendingVaccines/);
  assert.match(soap, /não gera prescrição, produto, dose ou esquema/i);
});

test("impressão do relatório e da tabela de medicamentos permanece acessível sem remover salvaguardas", async () => {
  const [page, workspace, report] = await Promise.all([
    text(files.consultationPage),
    text(files.consultationWorkspace),
    text(files.report),
  ]);

  assert.match(page, /ConsultationWorkspace/);
  assert.match(workspace, /Abrir e imprimir tabela/);
  assert.match(workspace, /\/consultations\/\$\{consultationId\}\/medications\/print/);
  assert.match(workspace, /salvaguardas de identidade e reconciliação/i);

  assert.match(report, /Imprimir relatório/);
  assert.match(report, /disabled=\{!generated \|\| !clinicalReviewConfirmed\}/);
  assert.match(report, /Revisão clínica antes de compartilhar/);
});
