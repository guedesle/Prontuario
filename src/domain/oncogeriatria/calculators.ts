export const G8_SCALE_CODE = "G8" as const;
export const G8_SCALE_VERSION = "ORIGINAL_2012" as const;
export const CARG_SCALE_CODE = "CARG" as const;
export const CARG_SCALE_VERSION = "HURRIA_2011" as const;

export type G8FoodIntake = "SEVERE_DECREASE" | "MODERATE_DECREASE" | "NO_DECREASE";
export type G8WeightLoss = "GT_3_KG" | "UNKNOWN" | "BETWEEN_1_AND_3_KG" | "NONE";
export type G8Mobility = "BED_OR_CHAIR" | "GETS_UP_DOES_NOT_GO_OUT" | "GOES_OUT";
export type G8Neuropsychological = "SEVERE" | "MILD" | "NONE";
export type G8HealthStatus = "WORSE" | "UNKNOWN" | "SAME" | "BETTER";

export interface G8Input {
  foodIntake: G8FoodIntake;
  weightLoss: G8WeightLoss;
  mobility: G8Mobility;
  neuropsychological: G8Neuropsychological;
  bmi: number;
  takesMoreThanThreePrescriptionDrugs: boolean;
  healthStatusComparedWithPeers: G8HealthStatus;
  ageYears: number;
}

export interface G8Result {
  score: number;
  classification: "VULNERABLE_SCREEN" | "NOT_VULNERABLE_SCREEN";
  cutoff: number;
  scaleCode: typeof G8_SCALE_CODE;
  scaleVersion: typeof G8_SCALE_VERSION;
}

function assertFiniteNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} inválido.`);
}

export function calculateG8(input: G8Input): G8Result {
  assertFiniteNonNegative(input.bmi, "IMC");
  assertFiniteNonNegative(input.ageYears, "Idade");

  const foodScore: Record<G8FoodIntake, number> = {
    SEVERE_DECREASE: 0,
    MODERATE_DECREASE: 1,
    NO_DECREASE: 2,
  };
  const weightScore: Record<G8WeightLoss, number> = {
    GT_3_KG: 0,
    UNKNOWN: 1,
    BETWEEN_1_AND_3_KG: 2,
    NONE: 3,
  };
  const mobilityScore: Record<G8Mobility, number> = {
    BED_OR_CHAIR: 0,
    GETS_UP_DOES_NOT_GO_OUT: 1,
    GOES_OUT: 2,
  };
  const neuroScore: Record<G8Neuropsychological, number> = {
    SEVERE: 0,
    MILD: 1,
    NONE: 2,
  };
  const healthScore: Record<G8HealthStatus, number> = {
    WORSE: 0,
    UNKNOWN: 0.5,
    SAME: 1,
    BETTER: 2,
  };
  const bmiScore = input.bmi < 19 ? 0 : input.bmi < 21 ? 1 : input.bmi < 23 ? 2 : 3;
  const medicationScore = input.takesMoreThanThreePrescriptionDrugs ? 0 : 1;
  const ageScore = input.ageYears > 85 ? 0 : input.ageYears >= 80 ? 1 : 2;
  const score =
    foodScore[input.foodIntake] +
    weightScore[input.weightLoss] +
    mobilityScore[input.mobility] +
    neuroScore[input.neuropsychological] +
    bmiScore +
    medicationScore +
    healthScore[input.healthStatusComparedWithPeers] +
    ageScore;

  return {
    score,
    classification: score <= 14 ? "VULNERABLE_SCREEN" : "NOT_VULNERABLE_SCREEN",
    cutoff: 14,
    scaleCode: G8_SCALE_CODE,
    scaleVersion: G8_SCALE_VERSION,
  };
}

export type CargSex = "MALE" | "FEMALE";
export type CargCancerType = "GI_GU" | "OTHER";
export type CargPlannedDose = "STANDARD" | "REDUCED_UPFRONT";
export type CargDrugCount = "MONO" | "POLY";
export type CargHearing = "EXCELLENT_GOOD" | "FAIR_POOR_DEAF";
export type CargMedicationIndependence = "WITHOUT_HELP" | "WITH_HELP_OR_UNABLE";
export type CargWalkingLimitation = "NOT_LIMITED" | "SOMEWHAT_OR_A_LOT";
export type CargSocialInterference = "NONE_OR_LITTLE" | "SOME_MOST_ALL";

export interface CargInput {
  ageYears: number;
  sex: CargSex;
  cancerType: CargCancerType;
  plannedDose: CargPlannedDose;
  plannedDrugCount: CargDrugCount;
  hemoglobinGdl: number;
  creatinineClearanceMlMin: number;
  hearing: CargHearing;
  fallsLastSixMonths: number;
  medicationIndependence: CargMedicationIndependence;
  walkingLimitation: CargWalkingLimitation;
  socialInterference: CargSocialInterference;
}

export interface CargResult {
  score: number;
  category: "LOW" | "INTERMEDIATE" | "HIGH";
  scaleCode: typeof CARG_SCALE_CODE;
  scaleVersion: typeof CARG_SCALE_VERSION;
  decisionSupportMessage: string;
}

export function calculateCarg(input: CargInput): CargResult {
  assertFiniteNonNegative(input.ageYears, "Idade");
  assertFiniteNonNegative(input.hemoglobinGdl, "Hemoglobina");
  assertFiniteNonNegative(input.creatinineClearanceMlMin, "Clearance de creatinina");
  assertFiniteNonNegative(input.fallsLastSixMonths, "Quedas");

  const hemoglobinThreshold = input.sex === "MALE" ? 11 : 10;
  const score =
    (input.ageYears >= 72 ? 2 : 0) +
    (input.cancerType === "GI_GU" ? 2 : 0) +
    (input.plannedDose === "STANDARD" ? 2 : 0) +
    (input.plannedDrugCount === "POLY" ? 2 : 0) +
    (input.hemoglobinGdl < hemoglobinThreshold ? 3 : 0) +
    (input.creatinineClearanceMlMin < 34 ? 3 : 0) +
    (input.hearing === "FAIR_POOR_DEAF" ? 2 : 0) +
    (input.fallsLastSixMonths >= 1 ? 3 : 0) +
    (input.medicationIndependence === "WITH_HELP_OR_UNABLE" ? 1 : 0) +
    (input.walkingLimitation === "SOMEWHAT_OR_A_LOT" ? 2 : 0) +
    (input.socialInterference === "SOME_MOST_ALL" ? 1 : 0);

  const category = score <= 5 ? "LOW" : score <= 9 ? "INTERMEDIATE" : "HIGH";
  return {
    score,
    category,
    scaleCode: CARG_SCALE_CODE,
    scaleVersion: CARG_SCALE_VERSION,
    decisionSupportMessage: "Estimativa de risco para apoio à decisão clínica compartilhada.",
  };
}
