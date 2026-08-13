import assert from "node:assert/strict";
import test from "node:test";
import { buildClinicalChangeSummary } from "../../src/domain/clinical-change-summary.ts";

const d = (day: number) => `2026-08-${String(day).padStart(2, "0")}T10:00:00-03:00`;

test("resumo longitudinal não mistura pacientes", () => {
  assert.throws(() => buildClinicalChangeSummary([
    { patientId: "p1", consultationId: "c1", scaleCode: "barthel", scaleVersion: "1", score: 80, appliedAt: d(1) },
    { patientId: "p2", consultationId: "c2", scaleCode: "barthel", scaleVersion: "1", score: 70, appliedAt: d(2) },
  ]), /pacientes diferentes/);
});

test("motor prioriza piora em escala vermelha e gera narrativa conservadora", () => {
  const summary = buildClinicalChangeSummary([
    { patientId: "p1", consultationId: "c1", scaleCode: "barthel", scaleVersion: "1", score: 90, color: "verde", appliedAt: d(1), isBaseline: true },
    { patientId: "p1", consultationId: "c2", scaleCode: "barthel", scaleVersion: "1", score: 70, color: "amarelo", appliedAt: d(5) },
    { patientId: "p1", consultationId: "c3", scaleCode: "barthel", scaleVersion: "1", score: 30, color: "vermelho", classification: "Dependência grave", appliedAt: d(10) },
  ]);
  assert.equal(summary.counts.unfavorable, 1);
  assert.equal(summary.cards[0]?.scaleId, "barthel");
  assert.equal(summary.cards[0]?.priority, 1);
  assert.match(summary.narrative[0] ?? "", /Tendência desfavorável/);
  assert.doesNotMatch(summary.narrative[0] ?? "", /significativa/i);
});

test("motor mantém versões diferentes como não comparáveis", () => {
  const summary = buildClinicalChangeSummary([
    { patientId: "p1", consultationId: "c1", scaleCode: "moca", scaleVersion: "A", score: 25, color: "amarelo", appliedAt: d(1), isBaseline: true },
    { patientId: "p1", consultationId: "c2", scaleCode: "moca", scaleVersion: "B", score: 22, color: "amarelo", appliedAt: d(2) },
  ]);
  assert.equal(summary.cards[0]?.vsPrevious.trend, "not-comparable");
  assert.equal(summary.counts.notComparable, 1);
});

test("CAM positivo vira alerta urgente e sobe para o topo", () => {
  const summary = buildClinicalChangeSummary([
    { patientId: "p1", consultationId: "c1", scaleCode: "barthel", scaleVersion: "1", score: 80, color: "amarelo", appliedAt: d(1), isBaseline: true },
    { patientId: "p1", consultationId: "c2", scaleCode: "barthel", scaleVersion: "1", score: 75, color: "amarelo", appliedAt: d(2) },
    { patientId: "p1", consultationId: "c2", scaleCode: "cam", scaleVersion: "1", score: 1, scoreText: "Positivo", color: "vermelho", appliedAt: d(2), answers: { c1: 1, c2: 1, c3: 1 } },
  ]);
  assert.equal(summary.cards[0]?.scaleId, "cam");
  assert.equal(summary.counts.urgentAlerts, 1);
  assert.match(summary.urgentAlerts[0]?.message ?? "", /delirium provável/i);
});

test("ESAS focal >=7 gera atenção mesmo com soma global baixa", () => {
  const summary = buildClinicalChangeSummary([
    { patientId: "p1", consultationId: "c1", scaleCode: "esas", scaleVersion: "1", score: 5, color: "verde", appliedAt: d(1), isBaseline: true, answers: { es1: 5 } },
    { patientId: "p1", consultationId: "c2", scaleCode: "esas", scaleVersion: "1", score: 7, color: "verde", appliedAt: d(2), answers: { es1: 7, es2: 0, es3: 0, es4: 0, es5: 0, es6: 0, es7: 0, es8: 0, es9: 0 } },
  ]);
  assert.ok(summary.attentionAlerts.some((alert) => alert.code === "esas-severe-symptom"));
});
