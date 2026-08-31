import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const editor = readFileSync("src/components/consultations/soap-editor.tsx", "utf8");
const styles = readFileSync("src/components/consultations/soap-editor.module.css", "utf8");
const workspace = readFileSync("src/components/consultations/consultation-workspace.tsx", "utf8");

test("evolução clínica usa fluxo vertical e deixa ações de cópia após o preenchimento", () => {
  assert.ok(styles.includes(".card {\n  display: flex;\n  flex-direction: column;"));
  assert.ok(styles.includes(".soapGrid {\n  order: 20;"));
  assert.ok(styles.includes("grid-template-columns: minmax(0, 1fr);"));
  assert.ok(styles.includes(".copyPanel {\n  order: 30;"));
});

test("vacinas permanecem clinicamente intactas e ganham separação visual", () => {
  assert.ok(editor.includes("deriveVaccinationReview"));
  assert.ok(editor.includes("GERIATRIC_VACCINE_CHECKLIST"));
  assert.ok(editor.includes("Carteira/status vacinal revisado nesta consulta"));
  assert.ok(styles.includes(".vaccinePanel {"));
  assert.ok(styles.includes("border-left: 4px solid var(--primary) !important;"));
});

test("campos e salvaguardas clínicas do SOAP continuam presentes", () => {
  assert.ok(editor.includes("S — Subjetivo"));
  assert.ok(editor.includes("O — Objetivo"));
  assert.ok(editor.includes("A — Avaliação"));
  assert.ok(editor.includes("P — Plano e condutas"));
  assert.ok(editor.includes("Exames laboratoriais e de imagem"));
  assert.ok(editor.includes("expectedNoteVersion: view.noteVersion"));
  assert.ok(editor.includes("summarizeSoapMedicationProvenance"));
});

test("regressão: etapa soap mantém evolução e plano explícitos na navegação", () => {
  assert.match(
    workspace,
    /\{\s*id:\s*"soap",\s*label:\s*"Evolução e plano",\s*shortLabel:\s*"Evolução \+ plano",\s*description:\s*"SOAP, exames, vacinas e plano por problema"\s*\}/,
  );
  assert.ok(workspace.includes('useState<WorkspaceSectionId>("soap")'));
});
