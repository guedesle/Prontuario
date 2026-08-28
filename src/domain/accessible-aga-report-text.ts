import type { AgaReportModel } from "./aga-report.ts";
import { MEDICATION_MOMENT_LABELS, type MedicationMoment } from "./medication-plan.ts";
import {
  alertSeverityLabel,
  consultationStatusLabel,
  problemStatusLabel,
  problemTypeLabel,
  sourceStatusLabel,
} from "./accessible-report-language.ts";

function list(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- Sem dados registrados";
}

function carePlanBlock(title: string, items: readonly string[]): string[] {
  return items.length > 0 ? ["", title, list(items)] : [];
}

export function renderAccessibleAgaReportText(model: AgaReportModel): string {
  const blocks = [
    `RELATÓRIO DA AVALIAÇÃO GERIÁTRICA AMPLA — LONGITUDINAL — ${model.patientName}`,
    `Consulta: ${model.consultationId} · Situação: ${consultationStatusLabel(model.consultationStatus)}`,
    "",
    "RESUMO LONGITUDINAL",
    model.changeSummary.headline,
    list(model.changeSummary.narrative),
  ];

  if (model.draftContext) {
    blocks.push("", "ATENÇÃO: relatório gerado antes da finalização da consulta.");
  }

  if (model.clinicalProblems.length > 0) {
    blocks.push(
      "",
      "PROBLEMAS CLÍNICOS",
      list(model.clinicalProblems.map((problem) => `${problem.title} [${problemStatusLabel(problem.status)}]`)),
    );
  }
  if (model.geriatricProblems.length > 0) {
    blocks.push(
      "",
      "PROBLEMAS GERIÁTRICOS",
      list(model.geriatricProblems.map((problem) => `${problem.title} [${problemStatusLabel(problem.status)}]`)),
    );
  }

  const vaccinationItems = model.vaccinationPrevention.status === "PENDING"
    ? model.vaccinationPrevention.pendingVaccines
    : model.vaccinationPrevention.status === "UNKNOWN"
      ? ["Não foi possível definir pendências porque a carteira de vacinação ainda não foi revisada."]
      : ["Nenhuma vacina pendente foi registrada nesta consulta."];

  blocks.push(
    "",
    "VACINAS E PREVENÇÃO",
    `Situação: ${model.vaccinationPrevention.statusLabel}`,
    "Vacinas pendentes:",
    list(vaccinationItems),
    "Orientação:",
    list(model.vaccinationPrevention.guidance),
    "Esta seção é informativa, não contém prescrição automática e permanece separada da tabela de medicamentos.",
  );

  for (const scale of model.assessedScales.filter((item) => item.assessedInTargetConsultation)) {
    const resultLabel = "Avaliado nesta consulta";
    const finalPoint = `atual ${scale.evolution.current ?? "—"}${scale.evolution.currentVersion ? ` (v${scale.evolution.currentVersion})` : ""}`;
    blocks.push(
      "",
      `${scale.name} (${scale.code} · versão ${scale.version})`,
      `Dado coletado nesta consulta: ${scale.collectedData.length > 0 ? scale.collectedData.map((item) => `${item.field}=${item.value}`).join("; ") : "sem respostas detalhadas registradas"}`,
      `${resultLabel}: ${scale.result.scoreText ?? scale.result.score ?? "sem pontuação registrada"}`,
      `Classificação: ${scale.result.classification ?? "sem classificação registrada"}`,
      `Interpretação: ${scale.interpretation ?? "sem interpretação registrada"}`,
      `Trajetória: avaliação inicial ${scale.evolution.baseline ?? "—"} (v${scale.evolution.baselineVersion}); anterior ${scale.evolution.previous ?? "—"}${scale.evolution.previousVersion ? ` (v${scale.evolution.previousVersion})` : ""}; ${finalPoint}; ${scale.evolution.vsPrevious}`,
      `Problema relacionado (proposta): ${scale.relatedProblemProposals.map((problem) => `[${problemTypeLabel(problem.type)}] ${problem.title}`).join("; ") || "nenhum proposto"}`,
      `Fonte: ${sourceStatusLabel(scale.source.status)}${scale.source.citation ? ` · ${scale.source.citation}` : ""}`,
      "Sugestões que ainda precisam de revisão médica:",
      list(scale.interventionSuggestions.map((suggestion) => suggestion.text)),
    );
  }

  const carePlanBlocks = [
    ...carePlanBlock("Agora", model.carePlan.now),
    ...carePlanBlock("Médio prazo", model.carePlan.mediumTerm),
    ...carePlanBlock("Família/cuidador", model.carePlan.caregiver),
    ...carePlanBlock("Encaminhamentos", model.carePlan.referrals),
  ];
  if (carePlanBlocks.length > 0) {
    blocks.push("", "PLANO DE CUIDADO — SUGESTÕES QUE PRECISAM DE REVISÃO MÉDICA", ...carePlanBlocks);
  }

  blocks.push(
    "",
    "QUANDO PROCURAR AJUDA MÉDICA IMEDIATA",
    list(model.safetyGuidance.urgent),
    "",
    "QUANDO ENTRAR EM CONTATO COM A EQUIPE",
    list(model.safetyGuidance.contact),
    `Base científica: ${model.safetyGuidance.evidenceReferences.map((reference) => `PMID ${reference.pmid}`).join(" · ")}.`,
  );

  if (model.alerts.length > 0) {
    blocks.push(
      "",
      "PONTOS DE ATENÇÃO",
      list(model.alerts.map((alert) => `[${alertSeverityLabel(alert.severity)}] ${alert.message}`)),
    );
  }

  blocks.push("", "TABELA FINAL DE MEDICAMENTOS", model.medicationPlan.message);
  if (model.medicationPlan.status === "READY" && model.medicationPlan.plan) {
    if (model.medicationPlan.plan.rows.length === 0) {
      blocks.push("- Nenhum medicamento ativo reconciliado nesta consulta.");
    }
    for (const row of model.medicationPlan.plan.rows) {
      const details = [row.doseInstruction, row.route, row.continuous ? "uso contínuo" : undefined]
        .filter(Boolean)
        .join(" · ");
      blocks.push(
        "",
        `- ${row.medicationText}${details ? ` — ${details}` : ""}`,
        Object.entries(row.moments)
          .map(([moment, selected]) => `${selected ? "[x]" : "[ ]"} ${MEDICATION_MOMENT_LABELS[moment as MedicationMoment]}`)
          .join("  "),
      );
      if (row.instructions) blocks.push(`  ${row.instructions}`);
    }
  }

  return blocks.join("\n");
}
