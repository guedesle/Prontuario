import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../../src/app/consultations/[id]/page.tsx", import.meta.url);
const workspaceUrl = new URL("../../src/components/consultations/consultation-workspace.tsx", import.meta.url);
const soapUrl = new URL("../../src/components/consultations/soap-editor.tsx", import.meta.url);
const reportTabsUrl = new URL("../../src/components/reports/report-workspace-tabs.tsx", import.meta.url);

async function text(url: URL) {
  return readFile(url, "utf8");
}

test("consulta não monta todos os workspaces na carga inicial", async () => {
  const [page, workspace] = await Promise.all([text(pageUrl), text(workspaceUrl)]);

  assert.match(page, /ConsultationWorkspace/);
  assert.doesNotMatch(page, /from "@\/components\/problems\/problem-workspace"/);
  assert.doesNotMatch(page, /from "@\/components\/medications\/medication-workspace"/);
  assert.doesNotMatch(page, /from "@\/components\/scales\/clinical-scales-workspace"/);
  assert.doesNotMatch(page, /from "@\/components\/consultations\/consultation-finalization-panel"/);

  assert.match(workspace, /dynamic\(/);
  assert.match(workspace, /useState<WorkspaceSectionId>\("soap"\)/);
  assert.match(workspace, /useState<Set<WorkspaceSectionId>>\(\(\) => new Set\(\["soap"\]\)\)/);
  assert.match(workspace, /visited\.has\("problemas"\)/);
  assert.match(workspace, /visited\.has\("medicamentos"\)/);
  assert.match(workspace, /visited\.has\("escalas"\)/);
  assert.match(workspace, /visited\.has\("relatorio"\)/);
  assert.match(workspace, /visited\.has\("finalizacao"\)/);
  assert.match(workspace, /hidden=\{active !==/);
});

test("SOAP não carrega medicações e escalas auxiliares antes de serem necessárias", async () => {
  const soap = await text(soapUrl);

  assert.match(soap, /useEffect\(\(\) => \{ void load\(\); \}, \[consultationId\]\)/);
  assert.doesNotMatch(soap, /useEffect\(\(\) => \{[^}]*ensureMedications/s);
  assert.doesNotMatch(soap, /useEffect\(\(\) => \{[^}]*ensureScaleResults/s);
  assert.match(soap, /async function ensureMedications/);
  assert.match(soap, /async function ensureScaleResults/);
  assert.match(soap, /async function copySoap\(\)[\s\S]*medicationsForCopy/);
  assert.match(soap, /async function copyScales\(\)[\s\S]*ensureScaleResults/);
  assert.match(soap, /Para deixar a tela mais leve/);
});

test("condutas não geram segundo editor nem segunda leitura de nota no relatório", async () => {
  const [soap, reportTabs] = await Promise.all([text(soapUrl), text(reportTabsUrl)]);

  assert.match(soap, /P — Plano e condutas/);
  assert.match(soap, /planSuggestions/);
  assert.match(soap, /Salvar evolução e plano/);
  assert.match(reportTabs, /AgaReportDocumentPreview/);
  assert.doesNotMatch(reportTabs, /GeriatricConductWorkspace/);
  assert.doesNotMatch(reportTabs, /\/api\/consultations/);
});
