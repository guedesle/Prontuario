import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const panel = readFileSync("src/components/consultations/consultation-finalization-panel.tsx", "utf8");
const home = readFileSync("src/app/page.tsx", "utf8");

test("consulta finalizada oferece retorno explícito ao localizador de pacientes da tela inicial", () => {
  assert.match(panel, /workflow\?\.status === "FINALIZED"[\s\S]*?<Link className=\{styles\.returnToPatients\} href="\/">[\s\S]*?Voltar à lista de pacientes[\s\S]*?<\/Link>/);
  assert.match(home, /<PatientFinder \/>/);
  assert.doesNotMatch(panel, /href="\/patients"/);
});

test("retorno à lista é opcional e não substitui a confirmação de finalização", () => {
  assert.match(panel, /action: "finalize"/);
  assert.match(panel, /clinicalReviewConfirmed/);
  assert.match(panel, /acknowledgedUrgentAlertCodes/);
  assert.doesNotMatch(panel, /router\.(?:push|replace)\("\/"\)/);
  assert.doesNotMatch(panel, /router\.(?:push|replace)\("\/patients"\)/);
});
