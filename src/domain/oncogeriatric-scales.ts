import type { ClinicalColor, ScaleResult } from "./clinical-engine.ts";

export const ECOG_VERSION = "Oken-1982" as const;
export const CRASH_MNA_SF_VERSION = "CRASH-MNA-SF-local-1.0" as const;

export const ECOG_OPTIONS = [
  { value: 0, label: "Totalmente ativo, capaz de manter todas as atividades que realizava antes da doença, sem restrições." },
  { value: 1, label: "Com restrições para atividades fisicamente extenuantes, mas capaz de se locomover e realizar trabalhos leves ou sedentários, como tarefas domésticas leves ou trabalho de escritório." },
  { value: 2, label: "Ambulante e capaz de realizar todos os cuidados pessoais, mas incapaz de exercer qualquer atividade laboral; permanece em pé e ativo por mais de 50% das horas em que está acordado." },
  { value: 3, label: "Capaz apenas de cuidados pessoais limitados; permanece acamado ou sentado por mais de 50% das horas em que está acordado." },
  { value: 4, label: "Completamente incapacitado; incapaz de realizar qualquer tipo de autocuidado; totalmente confinado à cama ou cadeira de rodas." },
  { value: 5, label: "Morto." },
] as const;

const ECOG_COLORS: readonly ClinicalColor[] = ["verde", "amarelo", "amarelo", "vermelho", "vermelho", "vermelho"];

export function scoreEcog(raw: unknown): ScaleResult {
  const rawString = String(raw ?? "").trim();
  const value = Number(rawString);
  const option = ECOG_OPTIONS.find((item) => item.value === value);
  if (rawString === "" || !Number.isInteger(value) || !option) {
    return { score: null, scoreText: "—", classe: "Aguardando seleção", cor: "cinza", texto: "Selecione um grau ECOG válido entre 0 e 5." };
  }
  return {
    score: value,
    scoreText: `ECOG ${value}`,
    classe: `Estado de desempenho ECOG ${value}`,
    cor: ECOG_COLORS[value]!,
    texto: option.label,
  };
}

export type CrashRiskCategory = "Baixo" | "Intermediário-baixo" | "Intermediário-alto" | "Alto";

export interface CrashMnaSfInput {
  chemotherapyRisk: 0 | 1 | 2;
  diastolicBloodPressure: number;
  iadlScore: number;
  ldh: number;
  ecog: 0 | 1 | 2 | 3 | 4;
  mmseScore: number;
  mnaSfScore: number;
}

export interface CrashMnaSfResult extends ScaleResult {
  hematologicScore: number;
  hematologicCategory: CrashRiskCategory;
  nonHematologicScore: number;
  nonHematologicCategory: CrashRiskCategory;
  combinedScore: number;
  combinedCategory: CrashRiskCategory;
  localAdaptation: true;
}

function assertRange(label: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label} deve estar entre ${min} e ${max}.`);
}

function crashCategory(score: number, kind: "hematologic" | "nonhematologic" | "combined"): CrashRiskCategory {
  const thresholds = kind === "hematologic" ? [1, 3, 5] : kind === "nonhematologic" ? [2, 4, 6] : [3, 6, 9];
  if (score <= thresholds[0]!) return "Baixo";
  if (score <= thresholds[1]!) return "Intermediário-baixo";
  if (score <= thresholds[2]!) return "Intermediário-alto";
  return "Alto";
}

function categoryColor(category: CrashRiskCategory): ClinicalColor {
  if (category === "Baixo") return "verde";
  if (category === "Alto") return "vermelho";
  return "amarelo";
}

/**
 * Adaptação institucional autorizada: substitui o MNA completo da CRASH pelo
 * MNA-SF (12–14 = 0 ponto; 0–11 = 2 pontos). Não equivale à CRASH validada.
 */
export function scoreCrashMnaSf(input: CrashMnaSfInput): CrashMnaSfResult {
  assertRange("Risco Chemotox", input.chemotherapyRisk, 0, 2);
  assertRange("Pressão arterial diastólica", input.diastolicBloodPressure, 1, 250);
  assertRange("AIVD", input.iadlScore, 10, 29);
  assertRange("LDH", input.ldh, 0, 100000);
  assertRange("ECOG", input.ecog, 0, 4);
  assertRange("MEEM", input.mmseScore, 0, 30);
  assertRange("MNA-SF", input.mnaSfScore, 0, 14);

  const hematologicScore = input.chemotherapyRisk
    + (input.diastolicBloodPressure > 72 ? 1 : 0)
    + (input.iadlScore < 26 ? 1 : 0)
    + (input.ldh > 459 ? 2 : 0);
  const nonHematologicScore = input.chemotherapyRisk
    + (input.ecog === 0 ? 0 : input.ecog <= 2 ? 1 : 2)
    + (input.mmseScore < 30 ? 2 : 0)
    + (input.mnaSfScore < 12 ? 2 : 0);
  const combinedScore = hematologicScore + nonHematologicScore - input.chemotherapyRisk;
  const hematologicCategory = crashCategory(hematologicScore, "hematologic");
  const nonHematologicCategory = crashCategory(nonHematologicScore, "nonhematologic");
  const combinedCategory = crashCategory(combinedScore, "combined");

  return {
    score: combinedScore,
    scoreText: `${combinedScore} (H ${hematologicScore} · NH ${nonHematologicScore})`,
    classe: `Risco ${combinedCategory.toLocaleLowerCase("pt-BR")} — adaptação local`,
    cor: categoryColor(combinedCategory),
    texto: "Adaptação institucional da CRASH com MNA-SF, sem validação externa. Interpretar os subescores separadamente e submeter o resultado à revisão médica; não usar isoladamente para decidir tratamento.",
    hematologicScore,
    hematologicCategory,
    nonHematologicScore,
    nonHematologicCategory,
    combinedScore,
    combinedCategory,
    localAdaptation: true,
  };
}
