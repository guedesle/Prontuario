import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  soap: new URL("../../src/components/consultations/soap-editor.tsx", import.meta.url),
  conduct: new URL("../../src/components/reports/geriatric-conduct-workspace.tsx", import.meta.url),
  consultationPage: new URL("../../src/app/consultations/[id]/page.tsx", import.meta.url),
  report: new URL("../../src/components/reports/aga-report-document-preview.tsx", import.meta.url),
  reportTabsCss: new URL("../../src/components/reports/report-workspace-tabs.module.css", import.meta.url),
};

async function text(url: URL): Promise<string> {
  return readFile(url, "utf8");
}

test("condutas são o único editor do plano e SOAP mantém P como resumo sincronizado", async () => {
  const [soap, conduct] = await Promise.all([text(files.soap), text(files.conduct)]);

  assert.match(conduct, /fonte única do plano/i);
  assert.match(conduct, /planByProblem/);
  assert.match(conduct, /Adicionar ao rascunho/);
  assert.match(conduct, /requiresPhysicianReview/);
  assert.match(conduct, /Salvar condutas/);
  assert.match(conduct, /clinical-note-changed/);

  assert.match(soap, /Fonte única: Condutas da consulta geriátrica/);
  assert.match(soap, /planSummaryList/);
  assert.doesNotMatch(soap, /Sugestão baseada na avaliação desta consulta/);
  assert.doesNotMatch(soap, /setProblemPlan/);
  assert.doesNotMatch(soap, /className=\{styles\.planField\}.*textarea/s);
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
  const [page, report, tabsCss] = await Promise.all([
    text(files.consultationPage),
    text(files.report),
    text(files.reportTabsCss),
  ]);

  assert.match(page, /Abrir e imprimir tabela/);
  assert.match(page, /\/consultations\/\$\{id\}\/medications\/print/);
  assert.match(page, /salvaguardas de identidade e reconciliação/i);

  assert.match(report, /Imprimir relatório/);
  assert.match(report, /disabled=\{!generated \|\| !clinicalReviewConfirmed\}/);
  assert.match(tabsCss, /position:\s*sticky/);
  assert.match(tabsCss, /:global\(\.no-print\):first-child/);
});
