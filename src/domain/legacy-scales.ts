import {
  scoreAnthropometry,
  scoreByEducation,
  scoreBySex,
  scoreCam,
  scoreGaitSpeed4m,
  scoreItems,
  scoreItemsWithEducationAdjustment,
  scoreNumeric,
  scoreMnaSf,
  scoreDiscreteNumeric,
  scoreEsas,
  scoreWeightedChecklist,
  charlsonAgeAdjustment,
  type ScaleResult,
} from "./clinical-engine.ts";
import {
  APGAR_FAMILY,
  BARTHEL,
  CHARLSON_RANGES,
  CHARLSON_WEIGHTS,
  CORNELL,
  G8,
  LAWTON,
  POLYPHARMACY,
  CHAIR_STAND_5X_RANGES,
  FRAIL_BR,
  GDS15,
  GRIP_ALTERED,
  GRIP_PRESERVED,
  GRIP_SEX_CUTOFFS,
  KATZ,
  KPS,
  LACE,
  MEEM_ALTERED,
  MEEM_EDUCATION_CUTOFFS,
  MEEM_PRESERVED,
  MNA_SF,
  MOCA_RANGES,
  PFEFFER,
  SARCF,
  SPPB,
  STOPP_FALL,
  TEN_CS,
  TEN_CS_EDUCATION_ADJUSTMENTS,
  VES13,
  ZARIT_REDUCED,
  FAST_ALLOWED_VALUES,
  FAST_RANGES,
  PPS_ALLOWED_VALUES,
  PPS_RANGES,
  ESAS,
} from "./clinical-config/legacy-core.ts";

export const legacyScales = {
  katz: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: KATZ.itemIds, answers, ranges: KATZ.ranges }),
  lawton: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: LAWTON.itemIds, answers, ranges: LAWTON.ranges }),
  barthel: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: BARTHEL.itemIds, answers, ranges: BARTHEL.ranges }),
  pfeffer: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: PFEFFER.itemIds, answers, ranges: PFEFFER.ranges }),
  gds15: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: GDS15.itemIds, answers, ranges: GDS15.ranges }),
  cornell: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: CORNELL.itemIds, answers, ranges: CORNELL.ranges }),
  frailBr: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: FRAIL_BR.itemIds, answers, ranges: FRAIL_BR.ranges }),
  sarcf: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: SARCF.itemIds, answers, ranges: SARCF.ranges }),
  sppb: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: SPPB.itemIds, answers, ranges: SPPB.ranges }),
  moca: (score: unknown) => scoreNumeric({ raw: score, ranges: MOCA_RANGES }),
  tenCs: (answers: Record<string, unknown>, education?: string | null) =>
    scoreItemsWithEducationAdjustment({
      itemIds: TEN_CS.itemIds,
      answers,
      education,
      adjustments: TEN_CS_EDUCATION_ADJUSTMENTS,
      maxScore: 10,
      ranges: TEN_CS.ranges,
    }),
  meem: (score: number, education?: string | null) =>
    scoreByEducation({
      value: score,
      education,
      cutoffs: MEEM_EDUCATION_CUTOFFS,
      preserved: MEEM_PRESERVED,
      altered: MEEM_ALTERED,
    }),
  cam: scoreCam,
  grip: (score: number, sex?: string | null) =>
    scoreBySex({
      value: score,
      sex,
      cutoffs: GRIP_SEX_CUTOFFS,
      preserved: GRIP_PRESERVED,
      altered: GRIP_ALTERED,
      unit: "kgF",
    }),
  gaitSpeed4m: scoreGaitSpeed4m,
  chairStand5x: (seconds: unknown) =>
    scoreNumeric({ raw: seconds, ranges: CHAIR_STAND_5X_RANGES, unit: "s" }),
  kps: (value: unknown) =>
    scoreNumeric({ raw: value, ranges: KPS.ranges, unit: "%" }),
  lace: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: LACE.itemIds, answers, ranges: LACE.ranges }),
  stoppFall: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: STOPP_FALL.itemIds, answers, ranges: STOPP_FALL.ranges }),
  polypharmacy: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: POLYPHARMACY.itemIds, answers, ranges: POLYPHARMACY.ranges }),
  g8: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: G8.itemIds, answers, ranges: G8.ranges }),
  apgarFamily: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: APGAR_FAMILY.itemIds, answers, ranges: APGAR_FAMILY.ranges }),
  zaritReduced: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: ZARIT_REDUCED.itemIds, answers, ranges: ZARIT_REDUCED.ranges }),
  ves13: (answers: Record<string, unknown>) =>
    scoreItems({ itemIds: VES13.itemIds, answers, ranges: VES13.ranges }),
  charlson: (answers: Record<string, unknown>, age?: number | null) =>
    scoreWeightedChecklist({
      weights: CHARLSON_WEIGHTS,
      answers,
      ranges: CHARLSON_RANGES,
      adjustment: charlsonAgeAdjustment(age),
    }),
  fast: (stage: unknown) =>
    scoreDiscreteNumeric({ raw: stage, allowedValues: FAST_ALLOWED_VALUES, ranges: FAST_RANGES }),
  pps: (value: unknown) =>
    scoreDiscreteNumeric({ raw: value, allowedValues: PPS_ALLOWED_VALUES, ranges: PPS_RANGES, unit: "%" }),
  esas: (answers: Record<string, unknown>) =>
    scoreEsas({ itemIds: ESAS.itemIds, answers, ranges: ESAS.ranges, urgentThreshold: 7 }),
  mnaSf: (input: {
    answers: Record<string, unknown>;
    bmi?: number | null;
    calfCm?: number | null;
  }) => scoreMnaSf({ ...input, ranges: MNA_SF.ranges }),
  anthropometry: scoreAnthropometry,
} satisfies Record<string, (...args: any[]) => unknown>;

export type LegacyScaleName = keyof typeof legacyScales;
export type LegacyScaleResult = ScaleResult;
