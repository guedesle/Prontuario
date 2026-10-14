import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeFamilyAgaProgress, FAMILY_AGA_SCALE_SLOTS, FAMILY_AGA_STAGES } from "../../src/domain/family-aga-workflow.ts";

const selector = readFileSync("src/app/modulos/page.tsx", "utf8");
const login = readFileSync("src/app/login/page.tsx", "utf8");
const journey = readFileSync("src/app/aga-medico-familia/aga-journey.tsx", "utf8");
const oauth = readFileSync("src/app/auth/google/route.ts", "utf8");

test("o seletor mantém o prontuário geriátrico e a AGA como módulos separados", () => {
  assert.match(selector, /href="\/"/);
  assert.match(selector, /href="\/aga-medico-familia"/);
});

test("progresso AGA não confunde preencher escalas com decisão clínica", () => {
  assert.equal(FAMILY_AGA_SCALE_SLOTS.length, 5);
  assert.equal(FAMILY_AGA_STAGES.length, 6);
  assert.deepEqual(computeFamilyAgaProgress([], []), {
    completed: 0, total: 10, percentage: 0, stagesCompleted: 0, stagesTotal: 6, scalesCompleted: 0, scalesTotal: 5,
  });
  assert.equal(computeFamilyAgaProgress(["contexto", "coleta"], ["escala-1", "escala-2"]).percentage, 40);
  assert.equal(computeFamilyAgaProgress(FAMILY_AGA_STAGES.map((x) => x.id), FAMILY_AGA_SCALE_SLOTS.map((x) => x.id)).percentage, 100);
  assert.equal(computeFamilyAgaProgress(["desconhecido"], ["inexistente"]).percentage, 0);
});

test("login conserva OAuth Google e exibe senha inativa enquanto não houver provisionamento", () => {
  assert.match(login, /href="\/auth\/google"/);
  assert.match(login, /data-google-auth-entrypoint="true"/);
  assert.match(login, /href="\/auth\/google\?manual=1"/);
  assert.match(login, /type="password"[^>]+disabled/);
  assert.match(oauth, /callbackURL: "\/modulos"/);
});

test("jornada AGA é demonstração sem armazenamento, risco ou encaminhamento automático", () => {
  assert.match(journey, /Protótipo · dados sintéticos/);
  assert.match(journey, /Nenhum dado clínico é digitado, transmitido ou persistido/);
  assert.match(journey, /Encaminhamento indisponível nesta fase/);
  assert.doesNotMatch(journey, /localStorage|sessionStorage|fetch\(|prisma\./);
});
