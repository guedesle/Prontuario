import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const panel = readFileSync("src/components/consultations/consultation-finalization-panel.tsx", "utf8");

test("consulta finalizada oferece retorno explícito à lista de pacientes", () => {
  assert.match(panel, /workflow\?\.status === "FINALIZED"[\s\S]*?<Link className=\{styles\.returnToPatients\} href="\/patients">[\s\S]*?Voltar à lista de pacientes[\s\S]*?<\/Link>/);
});

test("retorno à lista é opcional e não substitui a confirmação de finalização", () => {
  assert.match(panel, /action: "finalize"/);
  assert.match(panel, /clinicalReviewConfirmed/);
  assert.match(panel, /acknowledgedUrgentAlertCodes/);
  assert.doesNotMatch(panel, /router\.(?:push|replace)\("\/patients"\)/);
});
