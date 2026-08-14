import { buildClinicalChangeSummary, type LongitudinalAssessment } from "./clinical-change-summary.ts";
import { proposeProblemsFromAssessments } from "./problem-proposals.ts";
import { splitProblems, type ClinicalProblem } from "./problems.ts";
import { SCALE_CATALOG, scaleCatalogEntry } from "./scale-catalog.ts";

export type AgaReportConsultationStatus = "DRAFT" | "IN_REVIEW" | "FINALIZED";

export interface AgaCollectedDatum {
  field: string;
  value: string;
}

export interface AgaInterventionSuggestion {
  text: string;
  reviewStatus: "pending-medical-review";
}

export interface AgaScaleReportSection {
  code: string;
  version: string;
  name: string;
  dimension: string;
  collectedData: AgaCollectedDatum[];
  result: {
    score: number | null;
    scoreText?: string;
    classification?: string;
  };
  interpretation?: string;
  relatedProblemProposals: { title: string; type: "CLINICAL" | "GERIATRIC" }[];
  interventionSuggestions: AgaInterventionSuggestion[];
  evolution: {
    previous: number | null;
    baseline: number | null;
    current: number | null;
    vsPrevious: string;
    vsBaseline: string;
  };
  source: {
    status: string;
    citation?: string;
    note: string;
  };
}

export interface AgaReportModel {
  schemaVersion: "1.0";
  patientId: string;
  consultationId: string;
  consultationStatus: AgaReportConsultationStatus;
  draftContext: boolean;
  patientName: string;
  clinicalProblems: ClinicalProblem[];
  geriatricProblems: ClinicalProblem[];
  assessedScales: AgaScaleReportSection[];
  notAssessedScaleCodes: string[];
  alerts: { severity: string; message: string }[];
}

function displayCollectedValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function interventionTexts(card: ReturnType<typeof buildClinicalChangeSummary>["cards"][number]): string[] {
  return [...new Set([
    ...card.intervention.agora,
    ...card.intervention.medio,
    ...card.intervention.cuidador,
    ...card.intervention.encaminhamentos,
    ...card.intervention.contato,
    ...card.intervention.urgencia,
  ])];
}

export function buildAgaReportModel(input: {
  patientId: string;
  consultationId: string;
  consultationStatus: AgaReportConsultationStatus;
  patientName: string;
  longitudinalAssessments: readonly LongitudinalAssessment[];
  longitudinalProblems: readonly ClinicalProblem[];
}): AgaReportModel {
  if (!input.patientId || !input.consultationId) {
    throw new Error("Paciente e consulta são obrigatórios para gerar o relatório AGA.");
  }
  if (input.longitudinalProblems.some((problem) => problem.patientId !== input.patientId)) {
    throw new Error("Problema de outro paciente detectado no relatório AGA.");
  }

  const summary = buildClinicalChangeSummary(input.longitudinalAssessments);
  if (summary.patientId && summary.patientId !== input.patientId) {
    throw new Error("Avaliação de outro paciente detectada no relatório AGA.");
  }

  const currentAssessments = summary.cards.map((card) => card.current);
  const proposals = proposeProblemsFromAssessments(currentAssessments);
  const problems = splitProblems([...input.longitudinalProblems]);
  const assessedCodes = new Set(summary.cards.map((card) => card.scaleId));

  return {
    schemaVersion: "1.0",
    patientId: input.patientId,
    consultationId: input.consultationId,
    consultationStatus: input.consultationStatus,
    draftContext: input.consultationStatus !== "FINALIZED",
    patientName: input.patientName,
    clinicalProblems: problems.clinical,
    geriatricProblems: problems.geriatric,
    assessedScales: summary.cards.map((card) => {
      const definition = scaleCatalogEntry(card.scaleId);
      const relatedProposals = proposals
        .filter((proposal) => proposal.sourceScales.includes(card.scaleId))
        .map((proposal) => ({ title: proposal.title, type: proposal.type }));
      const collectedData = Object.entries(card.current.answers ?? {})
        .flatMap(([field, value]): AgaCollectedDatum[] => {
          const displayed = displayCollectedValue(value);
          return displayed === null ? [] : [{ field, value: displayed }];
        });

      return {
        code: card.scaleId,
        version: card.scaleVersion,
        name: card.name,
        dimension: card.dimension,
        collectedData,
        result: {
          score: card.current.score,
          scoreText: card.current.scoreText,
          classification: card.current.classification,
        },
        interpretation: card.current.interpretation,
        relatedProblemProposals: relatedProposals,
        interventionSuggestions: interventionTexts(card).map((text) => ({
          text,
          reviewStatus: "pending-medical-review" as const,
        })),
        evolution: {
          previous: card.vsPrevious.fromScore,
          baseline: card.baseline.score,
          current: card.current.score,
          vsPrevious: card.trendLabel,
          vsBaseline: card.vsBaseline.trend,
        },
        source: {
          status: definition.sourceStatus,
          citation: definition.source,
          note: definition.sourceNote,
        },
      };
    }),
    notAssessedScaleCodes: Object.keys(SCALE_CATALOG).filter((code) => !assessedCodes.has(code)),
    alerts: [...summary.urgentAlerts, ...summary.attentionAlerts].map((alert) => ({
      severity: alert.severity,
      message: alert.message,
    })),
  };
}

function list(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- sem dados registrados";
}

export function renderAgaReportText(model: AgaReportModel): string {
  const blocks = [
    `RELATÓRIO DA AVALIAÇÃO GERIÁTRICA AMPLA — ${model.patientName}`,
    `Consulta: ${model.consultationId} · Estado: ${model.consultationStatus}`,
  ];
  if (model.draftContext) {
    blocks.push("ATENÇÃO: relatório gerado antes da finalização da consulta.");
  }

  blocks.push(
    "",
    "PROBLEMAS CLÍNICOS",
    list(model.clinicalProblems.map((problem) => problem.title)),
    "",
    "PROBLEMAS GERIÁTRICOS",
    list(model.geriatricProblems.map((problem) => problem.title)),
  );

  for (const scale of model.assessedScales) {
    blocks.push(
      "",
      `${scale.name} (${scale.code} · versão ${scale.version})`,
      `Dado coletado: ${scale.collectedData.length > 0 ? scale.collectedData.map((item) => `${item.field}=${item.value}`).join("; ") : "sem respostas detalhadas registradas"}`,
      `Resultado/pontuação: ${scale.result.scoreText ?? scale.result.score ?? "sem pontuação registrada"}`,
      `Classificação: ${scale.result.classification ?? "sem classificação registrada"}`,
      `Interpretação: ${scale.interpretation ?? "sem interpretação registrada"}`,
      `Problema relacionado (proposta): ${scale.relatedProblemProposals.map((problem) => `[${problem.type}] ${problem.title}`).join("; ") || "nenhum proposto"}`,
      `Evolução: atual ${scale.evolution.current ?? "—"}; anterior ${scale.evolution.previous ?? "—"}; baseline ${scale.evolution.baseline ?? "—"}; ${scale.evolution.vsPrevious}`,
      `Fonte/status: ${scale.source.status}${scale.source.citation ? ` · ${scale.source.citation}` : ""}`,
      "Intervenções/sugestões pendentes de revisão médica:",
      list(scale.interventionSuggestions.map((suggestion) => suggestion.text)),
    );
  }

  blocks.push("", "ALERTAS VISÍVEIS", list(model.alerts.map((alert) => `[${alert.severity}] ${alert.message}`)));
  return blocks.join("\n");
}
