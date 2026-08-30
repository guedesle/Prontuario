import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const editor = readFileSync("src/components/consultations/soap-editor.tsx", "utf8");
const styles = readFileSync("src/components/consultations/soap-editor.module.css", "utf8");
const workspace = readFileSync("src/components/consultations/consultation-workspace.tsx", "utf8");

test("evolução clínica usa fluxo vertical e deixa ações de cópia após o preenchimento", () => {
  assert.match(styles, /\.card\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/);
  assert.match(styles, /\.soapGrid\s*\{[\s\S]*?order:\s*20;[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/);
  assert.match(styles, /\.copyPanel\s*\{[\s\S]*?order:\s*30;/);
});

test("vacinas permanecem clinicamente intactas e ganham separação visual", () => {
  assert.match(editor, /deriveVaccinationReview/);
  assert.match(editor, /GERIATRIC_VACCINE_CHECKLIST/);
  assert.match(editor, /Carteira\/status vacinal revisado nesta consulta/);
  assert.match(editor, /não gera prescrição, produto, dose ou esquema/);
  assert.match(styles, /\.vaccinePanel\s*\{[\s\S]*?border-left:\s*4px solid var\(--primary\)/);
});

test("campos e salvaguardas clínicas do SOAP continuam presentes", () => {
  assert.match(editor, /S — Subjetivo/);
  assert.match(editor, /O — Objetivo/);
  assert.match(editor, /A — Avaliação/);
  assert.match(editor, /P — Plano e condutas/);
  assert.match(editor, /Exames laboratoriais e de imagem/);
  assert.match(editor, /expectedNoteVersion:\s*view\.noteVersion/);
  assert.match(editor, /summarizeSoapMedicationProvenance/);
});

test("navegação apresenta a etapa com nome mais simples sem mudar o id soap", () => {
  assert.match(workspace, /id:\s*"soap",\s*label:\s*"Evolução clínica",\s*shortLabel:\s*"Evolução",\s*description:\s*"SOAP, exames, vacinas e plano por problema"/);
  assert.match(workspace, /const \[active, setActive\] = useState<WorkspaceSectionId>\("soap"\)/);
});
