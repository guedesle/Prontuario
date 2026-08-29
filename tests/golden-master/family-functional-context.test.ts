import assert from "node:assert/strict";
import test from "node:test";
import type { AgaScaleReportSection } from "../../src/domain/aga-report.ts";
import {
  contextualFamilyGuidance,
  deriveFamilyFunctionalContext,
} from "../../src/domain/family-functional-context.ts";

function scale(code: string, score: number): AgaScaleReportSection {
  return {
    code,
    version: "test",
    name: code,
    dimension: code === "barthel" || code === "lawton" ? "funcionalidade" : "cognicao",
    assessedInTargetConsultation: true,
    lastKnown: { consultationId: "c1", appliedAt: "2026-08-28T12:00:00.000Z", score, version: "test" },
    collectedData: [],
    result: { score },
    relatedProblemProposals: [],
    interventionSuggestions: [],
    evolution: {
      previous: null,
      previousVersion: null,
      baseline: score,
      baselineVersion: "test",
      current: score,
      currentVersion: "test",
      trend: "insufficient-data",
      vsPrevious: "Sem comparação",
      vsBaseline: "insufficient-data",
    },
    chartSeries: { scaleCode: code, scaleVersion: "test", points: [] },
    source: { status: "needs-review", note: "test" },
  };
}

test("FAST 7d tem precedência e transforma orientação funcional em cuidado integral", () => {
  const context = deriveFamilyFunctionalContext([
    scale("fast", 7.4),
    scale("barthel", 100),
    scale("lawton", 21),
  ]);

  assert.equal(context.level, "advanced-dementia");
  assert.equal(context.fastStage, "7d");
  assert.match(context.sourceSummary, /FAST 7d/);

  const guidance = contextualFamilyGuidance("funcionalidade", [
    "Facilite as atividades preservando a participação segura.",
  ], context).join(" ");

  assert.match(guidance, /assistência integral/i);
  assert.match(guidance, /conforto, segurança e dignidade/i);
  assert.doesNotMatch(guidance, /ajuda apenas na medida necessária/i);
  assert.doesNotMatch(guidance, /preservando a participação segura/i);
});

test("Barthel grave pode elevar necessidade de ajuda mesmo sem FAST avançado", () => {
  const context = deriveFamilyFunctionalContext([
    scale("fast", 4),
    scale("barthel", 25),
    scale("lawton", 21),
  ]);

  assert.equal(context.level, "high-dependence");
  const guidance = contextualFamilyGuidance("funcionalidade", ["Orientação genérica"], context).join(" ");
  assert.match(guidance, /dependência importante/i);
  assert.match(guidance, /banho, vestir-se, higiene, alimentação e transferências/i);
});

test("Lawton alterado contextualiza AIVD sem transformar dependência instrumental em dependência básica", () => {
  const context = deriveFamilyFunctionalContext([
    scale("fast", 3),
    scale("barthel", 100),
    scale("lawton", 15),
  ]);

  assert.equal(context.level, "iadl-support");
  const guidance = contextualFamilyGuidance("funcionalidade", ["Orientação genérica"], context).join(" ");
  assert.match(guidance, /atividades instrumentais/i);
  assert.match(guidance, /finanças, compras, transporte/i);
  assert.doesNotMatch(guidance, /assistência integral/i);
});

test("FAST 7d adapta cognição para comunicação e cuidado, sem exigir desempenho independente", () => {
  const context = deriveFamilyFunctionalContext([scale("fast", 7.4)]);
  const guidance = contextualFamilyGuidance("cognicao", [
    "Use calendário e relógio para orientar tarefas independentes.",
  ], context).join(" ");

  assert.match(guidance, /comunicação simples, calma e afetiva/i);
  assert.match(guidance, /sinais não verbais/i);
  assert.match(guidance, /sem exigir orientação temporal, memória ou execução independente/i);
});
