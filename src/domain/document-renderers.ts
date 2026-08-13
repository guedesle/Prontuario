import type { ClinicalProblem } from "./problems.ts";
import { splitProblems } from "./problems.ts";
import type { ClinicalChangeSummary } from "./clinical-change-summary.ts";
import type { InterventionPlan } from "./interventions.ts";

function clean(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : "sem dados registrados";
}

function bulletList(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- sem dados registrados";
}

export interface SoapMedication {
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
}

export interface SoapInput {
  patientName?: string;
  subjective?: string;
  physicalExam?: string;
  vitalSigns?: string;
  anthropometry?: string;
  medications?: SoapMedication[];
  problems: readonly ClinicalProblem[];
  planByProblem?: Readonly<Record<string, readonly string[]>>;
}

export function renderSoapText(input: SoapInput): string {
  const medications = input.medications?.length
    ? input.medications.map((medication) => {
        const details = [medication.dose, medication.route, medication.frequency].filter(Boolean).join(" · ");
        return `- ${medication.name}${details ? ` — ${details}` : ""}`;
      }).join("\n")
    : "- sem dados registrados";

  const assessment = input.problems.length > 0
    ? input.problems.map((problem, index) => `${index + 1}. ${problem.title}${problem.description ? ` — ${problem.description}` : ""}`).join("\n")
    : "sem dados registrados";

  const plan = input.problems.length > 0
    ? input.problems.map((problem, index) => {
        const actions = input.planByProblem?.[problem.id] ?? [];
        return `${index + 1}. ${problem.title}\n${bulletList(actions)}`;
      }).join("\n")
    : "sem dados registrados";

  return [
    "S — SUBJETIVO",
    clean(input.subjective),
    "",
    "O — OBJETIVO",
    `Exame físico: ${clean(input.physicalExam)}`,
    `Sinais vitais: ${clean(input.vitalSigns)}`,
    `Antropometria: ${clean(input.anthropometry)}`,
    "Medicações em uso:",
    medications,
    "",
    "A — AVALIAÇÃO",
    assessment,
    "",
    "P — PLANO",
    plan,
  ].join("\n");
}

export interface FamilyReportInput {
  patientName: string;
  problems: readonly ClinicalProblem[];
  changeSummary?: ClinicalChangeSummary;
  plan: InterventionPlan;
  attentionSigns?: readonly string[];
  contactPhone?: string;
}

export interface FamilyReportModel {
  patientName: string;
  clinicalProblems: string[];
  geriatricProblems: string[];
  evolutionHighlights: string[];
  now: string[];
  mediumTerm: string[];
  caregiver: string[];
  referrals: string[];
  attentionSigns: string[];
  contactPhone?: string;
}

export function buildFamilyReportModel(input: FamilyReportInput): FamilyReportModel {
  const split = splitProblems([...input.problems]);
  const evolutionHighlights = input.changeSummary?.cards
    .filter((card) => card.vsPrevious.trend === "favorable" || card.vsPrevious.trend === "unfavorable")
    .slice(0, 6)
    .map((card) => {
      const direction = card.vsPrevious.trend === "favorable" ? "melhora" : "piora";
      const from = card.vsPrevious.fromScore;
      const to = card.vsPrevious.toScore;
      return `${card.shortName}: ${direction} na pontuação registrada${from !== null && to !== null ? ` (${from} → ${to})` : ""}.`;
    }) ?? [];

  return {
    patientName: input.patientName,
    clinicalProblems: split.clinical.map((problem) => problem.title),
    geriatricProblems: split.geriatric.map((problem) => problem.title),
    evolutionHighlights,
    now: [...input.plan.agora],
    mediumTerm: [...input.plan.medio],
    caregiver: [...input.plan.cuidador],
    referrals: [...input.plan.encaminhamentos],
    attentionSigns: [...(input.attentionSigns ?? []), ...input.plan.contato, ...input.plan.urgencia],
    contactPhone: input.contactPhone,
  };
}

export function renderFamilyReportText(model: FamilyReportModel): string {
  const section = (title: string, items: readonly string[]) => [title, bulletList(items)].join("\n");
  const blocks = [
    `RELATÓRIO DE CUIDADOS — ${model.patientName}`,
    "",
    section("Problemas clínicos", model.clinicalProblems),
    "",
    section("Problemas geriátricos", model.geriatricProblems),
    "",
    section("Evolução desde a última avaliação", model.evolutionHighlights),
    "",
    section("O que fazer agora", model.now),
    "",
    section("Próximos passos", model.mediumTerm),
    "",
    section("Orientações ao cuidador", model.caregiver),
    "",
    section("Encaminhamentos", model.referrals),
    "",
    section("Sinais de atenção", model.attentionSigns),
  ];
  if (model.contactPhone) {
    blocks.push("", `Quando entrar em contato com o consultório: ${model.contactPhone}`);
  }
  return blocks.join("\n");
}
