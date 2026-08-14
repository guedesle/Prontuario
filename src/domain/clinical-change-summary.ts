import type { ClinicalColor, ScaleResult } from "./clinical-engine.ts";
import { clinicalAlertsFor, type ClinicalAlert } from "./clinical-alerts.ts";
import {
  buildCombinedPlan,
  interventionFor,
  type InterventionPlan,
} from "./interventions.ts";
import {
  buildScaleEvolution,
  type LongitudinalScalePoint,
  type ScaleComparison,
  type ScaleTrend,
} from "./longitudinal-scales.ts";
import { scaleCatalogEntry, type GeriatricDimension } from "./scale-catalog.ts";

export interface LongitudinalAssessment extends LongitudinalScalePoint {
  color?: ClinicalColor;
  classification?: string;
  interpretation?: string;
  scoreText?: string;
  answers?: Record<string, unknown>;
}

export interface ScaleChangeCard {
  scaleId: string;
  scaleVersion: string;
  name: string;
  shortName: string;
  dimension: GeriatricDimension;
  current: LongitudinalAssessment;
  previous: LongitudinalAssessment | null;
  baseline: LongitudinalAssessment;
  vsPrevious: ScaleComparison;
  vsBaseline: ScaleComparison;
  trendLabel: string;
  priority: number;
  intervention: InterventionPlan;
  alerts: ClinicalAlert[];
}

export interface ChangeSummaryCounts {
  favorable: number;
  stable: number;
  unfavorable: number;
  notComparable: number;
  insufficientData: number;
  urgentAlerts: number;
}

export interface ClinicalChangeSummary {
  patientId: string;
  cards: ScaleChangeCard[];
  counts: ChangeSummaryCounts;
  urgentAlerts: ClinicalAlert[];
  attentionAlerts: ClinicalAlert[];
  combinedPlan: InterventionPlan;
  headline: string;
  narrative: string[];
}

function trendLabel(trend: ScaleTrend): string {
  switch (trend) {
    case "favorable": return "Tendência numérica favorável";
    case "unfavorable": return "Tendência numérica desfavorável";
    case "stable": return "Estável numericamente";
    case "not-comparable": return "Não comparável";
    case "insufficient-data": return "Dados insuficientes";
  }
}

function priorityFor(input: {
  color?: ClinicalColor;
  trend: ScaleTrend;
  alerts: ClinicalAlert[];
}): number {
  if (input.alerts.some((alert) => alert.severity === "urgent")) return 0;
  if (input.color === "vermelho" && input.trend === "unfavorable") return 1;
  if (input.color === "vermelho") return 2;
  if (input.trend === "unfavorable") return 3;
  if (input.color === "amarelo") return 4;
  if (input.trend === "stable") return 5;
  if (input.trend === "favorable") return 6;
  return 7;
}

function numericPhrase(comparison: ScaleComparison): string {
  if (comparison.fromScore === null || comparison.toScore === null) return "sem dados suficientes";
  if (comparison.trend === "not-comparable") return "não comparável por diferença de instrumento/versão";
  const arrow = comparison.toScore > comparison.fromScore ? "↑" : comparison.toScore < comparison.fromScore ? "↓" : "→";
  return `${comparison.fromScore} ${arrow} ${comparison.toScore}`;
}

function narrativeFor(card: ScaleChangeCard): string | null {
  if (card.vsPrevious.trend === "insufficient-data") return null;
  const prefix = card.vsPrevious.trend === "unfavorable"
    ? "Tendência desfavorável"
    : card.vsPrevious.trend === "favorable"
      ? "Tendência favorável"
      : card.vsPrevious.trend === "stable"
        ? "Estável"
        : "Comparação indisponível";
  return `${prefix} em ${card.shortName}: ${numericPhrase(card.vsPrevious)} desde a consulta anterior; baseline ${numericPhrase(card.vsBaseline)}.`;
}

function makeScaleResult(point: LongitudinalAssessment): Pick<ScaleResult, "score" | "scoreText" | "cor" | "classe"> {
  return {
    score: point.score,
    scoreText: point.scoreText ?? (point.score === null ? "—" : String(point.score)),
    cor: point.color ?? "cinza",
    classe: point.classification ?? "Sem classificação registrada",
  };
}

export function buildClinicalChangeSummary(
  assessments: readonly LongitudinalAssessment[],
): ClinicalChangeSummary {
  if (assessments.length === 0) {
    return {
      patientId: "",
      cards: [],
      counts: { favorable: 0, stable: 0, unfavorable: 0, notComparable: 0, insufficientData: 0, urgentAlerts: 0 },
      urgentAlerts: [],
      attentionAlerts: [],
      combinedPlan: buildCombinedPlan([]),
      headline: "Sem avaliações longitudinais registradas.",
      narrative: [],
    };
  }

  const patientIds = new Set(assessments.map((item) => item.patientId));
  if (patientIds.size !== 1) {
    throw new Error("Resumo longitudinal não pode misturar pacientes diferentes.");
  }
  const patientId = assessments[0]!.patientId;

  const byScale = new Map<string, LongitudinalAssessment[]>();
  for (const assessment of assessments) {
    const key = assessment.scaleCode;
    const list = byScale.get(key) ?? [];
    list.push(assessment);
    byScale.set(key, list);
  }

  const cards: ScaleChangeCard[] = [];
  for (const [scaleId, points] of byScale) {
    const evolution = buildScaleEvolution(points);
    if (!evolution.current || !evolution.baseline) continue;
    const current = evolution.current as LongitudinalAssessment;
    const alerts = clinicalAlertsFor(scaleId, {
      answers: current.answers,
      result: makeScaleResult(current),
    });
    const metadata = scaleCatalogEntry(scaleId);
    const intervention = interventionFor(scaleId, current.color ?? "cinza");
    cards.push({
      scaleId,
      scaleVersion: current.scaleVersion,
      name: metadata.name,
      shortName: metadata.shortName,
      dimension: metadata.dimension,
      current,
      previous: evolution.previous as LongitudinalAssessment | null,
      baseline: evolution.baseline as LongitudinalAssessment,
      vsPrevious: evolution.vsPrevious,
      vsBaseline: evolution.vsBaseline,
      trendLabel: trendLabel(evolution.vsPrevious.trend),
      priority: priorityFor({ color: current.color, trend: evolution.vsPrevious.trend, alerts }),
      intervention,
      alerts,
    });
  }

  cards.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "pt-BR"));

  const allAlerts = cards.flatMap((card) => card.alerts);
  const urgentAlerts = allAlerts.filter((alert) => alert.severity === "urgent");
  const attentionAlerts = allAlerts.filter((alert) => alert.severity === "attention");
  const counts: ChangeSummaryCounts = {
    favorable: cards.filter((card) => card.vsPrevious.trend === "favorable").length,
    stable: cards.filter((card) => card.vsPrevious.trend === "stable").length,
    unfavorable: cards.filter((card) => card.vsPrevious.trend === "unfavorable").length,
    notComparable: cards.filter((card) => card.vsPrevious.trend === "not-comparable").length,
    insufficientData: cards.filter((card) => card.vsPrevious.trend === "insufficient-data").length,
    urgentAlerts: urgentAlerts.length,
  };

  const currentPlanInputs = cards.map((card) => ({
    scaleId: card.scaleId,
    color: card.current.color ?? "cinza" as ClinicalColor,
  }));
  const combinedPlan = buildCombinedPlan(currentPlanInputs);

  const headlineParts: string[] = [];
  if (counts.unfavorable) headlineParts.push(`${counts.unfavorable} piora(s) numérica(s)`);
  if (counts.favorable) headlineParts.push(`${counts.favorable} melhora(s) numérica(s)`);
  if (counts.stable) headlineParts.push(`${counts.stable} estabilidade(s)`);
  if (counts.urgentAlerts) headlineParts.push(`${counts.urgentAlerts} alerta(s) urgente(s)`);

  return {
    patientId,
    cards,
    counts,
    urgentAlerts,
    attentionAlerts,
    combinedPlan,
    headline: headlineParts.length > 0 ? headlineParts.join(" · ") : "Sem mudança numérica classificável.",
    narrative: cards.map(narrativeFor).filter((item): item is string => Boolean(item)),
  };
}
