export type ClinicalColor = "verde" | "amarelo" | "vermelho" | "cinza";

export interface Classification {
  classe: string;
  cor: ClinicalColor;
  texto: string;
}

export interface ScoreRange extends Classification {
  min: number;
  max: number;
}

export interface ScaleResult extends Classification {
  score: number | null;
  scoreText: string;
}

export function numericValue(value: unknown): number {
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function classifyRange(ranges: ScoreRange[], value: number): Classification {
  const match = ranges.find((range) => value >= range.min && value <= range.max);
  return match
    ? { classe: match.classe, cor: match.cor, texto: match.texto }
    : {
        classe: "Fora das faixas previstas",
        cor: "cinza",
        texto: "Valor fora das faixas configuradas.",
      };
}

export function sumAnswers(
  itemIds: readonly string[],
  answers: Record<string, unknown>,
): number {
  return itemIds.reduce((total, id) => total + numericValue(answers[id]), 0);
}

export function scoreItems(input: {
  itemIds: readonly string[];
  answers: Record<string, unknown>;
  ranges: ScoreRange[];
  unit?: string;
}): ScaleResult {
  const score = sumAnswers(input.itemIds, input.answers);
  return {
    score,
    scoreText: `${score}${input.unit ? ` ${input.unit}` : ""}`,
    ...classifyRange(input.ranges, score),
  };
}

export function scoreNumeric(input: {
  raw: unknown;
  ranges: ScoreRange[];
  unit?: string;
}): ScaleResult {
  const rawString = String(input.raw ?? "").trim();
  const value = Number.parseFloat(rawString);
  if (rawString === "" || Number.isNaN(value)) {
    return {
      score: null,
      scoreText: "—",
      classe: "Aguardando medida",
      cor: "cinza",
      texto: "Informe o valor medido.",
    };
  }

  return {
    score: value,
    scoreText: `${value}${input.unit ? ` ${input.unit}` : ""}`,
    ...classifyRange(input.ranges, value),
  };
}

export function scoreByEducation(input: {
  value: number;
  education: string | null | undefined;
  cutoffs: Record<string, number>;
  preserved: Classification;
  altered: Classification;
}): ScaleResult {
  const education = input.education || "Mais de 11 anos";
  const cutoff = input.cutoffs[education];
  if (cutoff === undefined) {
    throw new Error(`Escolaridade sem corte configurado: ${education}`);
  }
  const base = input.value >= cutoff ? input.preserved : input.altered;
  return {
    score: input.value,
    scoreText: String(input.value),
    ...base,
    texto: `${base.texto} (corte para '${education}': ${cutoff} pontos)`,
  };
}

export function scoreBySex(input: {
  value: number;
  sex: string | null | undefined;
  cutoffs: Record<string, number>;
  preserved: Classification;
  altered: Classification;
  unit?: string;
}): ScaleResult {
  const sex = input.sex || "Feminino";
  const cutoff = input.cutoffs[sex] ?? 16;
  const base = input.value >= cutoff ? input.preserved : input.altered;
  return {
    score: input.value,
    scoreText: `${input.value}${input.unit ? ` ${input.unit}` : ""}`,
    ...base,
    texto: `${base.texto} (corte para o sexo ${sex.toLowerCase()}: ${cutoff}${input.unit ? ` ${input.unit}` : ""})`,
  };
}

export function scoreCam(answers: Record<string, unknown>): ScaleResult {
  const positive =
    numericValue(answers.c1) === 1 &&
    numericValue(answers.c2) === 1 &&
    (numericValue(answers.c3) === 1 || numericValue(answers.c4) === 1);

  return positive
    ? {
        score: 1,
        scoreText: "Positivo",
        classe: "CAM positivo — delirium provável",
        cor: "vermelho",
        texto:
          "Critérios de delirium presentes. Investigar causa imediatamente (infecção, desidratação, distúrbio metabólico, dor, retenção urinária, constipação, medicações). Conduta urgente.",
      }
    : {
        score: 0,
        scoreText: "Negativo",
        classe: "CAM negativo",
        cor: "verde",
        texto: "Sem critérios para delirium no momento da avaliação.",
      };
}

export function scoreGaitSpeed4m(timeSeconds: unknown): ScaleResult {
  const time = Number.parseFloat(String(timeSeconds ?? ""));
  if (!Number.isFinite(time) || time <= 0) {
    return {
      score: null,
      scoreText: "—",
      classe: "Aguardando medida",
      cor: "cinza",
      texto: "Informe o valor medido.",
    };
  }
  const speed = Number((4 / time).toFixed(2));
  return {
    score: speed,
    scoreText: `${speed} m/s (tempo de ${time} s)`,
    ...classifyRange(
      [
        {
          min: 0.81,
          max: 99,
          classe: "Normal",
          cor: "verde",
          texto: "Velocidade de marcha preservada.",
        },
        {
          min: 0,
          max: 0.8,
          classe: "Reduzida",
          cor: "vermelho",
          texto:
            "Velocidade ≤ 0,8 m/s — critério de desempenho físico reduzido (EWGSOP2), associado a maior risco de quedas e pior tolerância a tratamentos.",
        },
      ],
      speed,
    ),
  };
}

export interface AnthropometryResult {
  color: ClinicalColor;
  bmi: ScaleResult | null;
  weightLoss6m: ScaleResult | null;
  calf: ScaleResult | null;
}

function worstColor(colors: ClinicalColor[]): ClinicalColor {
  if (colors.includes("vermelho")) return "vermelho";
  if (colors.includes("amarelo")) return "amarelo";
  if (colors.includes("verde")) return "verde";
  return "cinza";
}

export function scoreAnthropometry(input: {
  weight?: number;
  height?: number;
  weight6m?: number;
  calf?: number;
}): AnthropometryResult {
  let bmi: ScaleResult | null = null;
  let weightLoss6m: ScaleResult | null = null;
  let calf: ScaleResult | null = null;

  if ((input.weight ?? 0) > 0 && (input.height ?? 0) > 0) {
    const value = Number((input.weight! / input.height! ** 2).toFixed(1));
    bmi = {
      score: value,
      scoreText: String(value),
      ...classifyRange(
        [
          { min: 0, max: 21.9, classe: "Baixo peso para o idoso", cor: "vermelho", texto: "IMC abaixo de 22 kg/m² — considerado baixo peso na população idosa." },
          { min: 22, max: 27, classe: "Adequado", cor: "verde", texto: "IMC dentro da faixa recomendada para idosos (22 a 27 kg/m²)." },
          { min: 27.1, max: 99, classe: "Acima do recomendado", cor: "amarelo", texto: "IMC acima da faixa recomendada para idosos." },
        ],
        value,
      ),
    };
  }

  if ((input.weight6m ?? 0) > 0 && (input.weight ?? 0) > 0) {
    const value = Number((((input.weight6m! - input.weight!) / input.weight6m!) * 100).toFixed(1));
    weightLoss6m = {
      score: value,
      scoreText: String(value),
      ...classifyRange(
        [
          { min: -100, max: 4.99, classe: "Sem perda significativa", cor: "verde", texto: "Sem perda ponderal clinicamente significativa nos últimos 6 meses." },
          { min: 5, max: 9.99, classe: "Perda significativa", cor: "amarelo", texto: "Perda ponderal > 5% em 6 meses — critério de caquexia e fator de risco para toxicidade a tratamentos." },
          { min: 10, max: 100, classe: "Perda grave", cor: "vermelho", texto: "Perda ponderal > 10% em 6 meses — associada a maior mortalidade e a pior tolerância ao tratamento oncológico." },
        ],
        value,
      ),
    };
  }

  if ((input.calf ?? 0) > 0) {
    const value = Number(input.calf!.toFixed(1));
    calf = {
      score: value,
      scoreText: String(value),
      ...classifyRange(
        [
          { min: 0.1, max: 30.9, classe: "Reduzida", cor: "amarelo", texto: "Circunferência < 31 cm — sugere redução de massa muscular. Baixa sensibilidade em pacientes com sobrepeso." },
          { min: 31, max: 70, classe: "Adequada", cor: "verde", texto: "Circunferência da panturrilha dentro do esperado." },
        ],
        value,
      ),
    };
  }

  return {
    color: worstColor([bmi?.cor ?? "cinza", weightLoss6m?.cor ?? "cinza", calf?.cor ?? "cinza"]),
    bmi,
    weightLoss6m,
    calf,
  };
}

export function scoreItemsWithEducationAdjustment(input: {
  itemIds: readonly string[];
  answers: Record<string, unknown>;
  education: string | null | undefined;
  adjustments: Record<string, number>;
  maxScore: number;
  ranges: ScoreRange[];
}): ScaleResult & { rawScore: number; adjustment: number } {
  const rawScore = sumAnswers(input.itemIds, input.answers);
  const education = input.education || "Mais de 11 anos";
  const adjustment = input.adjustments[education] ?? 0;
  const score = Math.min(input.maxScore, rawScore + adjustment);
  const base = classifyRange(input.ranges, score);

  return {
    rawScore,
    adjustment,
    score,
    scoreText:
      adjustment > 0
        ? `${score} (bruto ${rawScore} + ajuste ${adjustment})`
        : String(score),
    ...base,
  };
}

export function scoreWeightedChecklist(input: {
  weights: Readonly<Record<string, number>>;
  answers: Record<string, unknown>;
  ranges: ScoreRange[];
  adjustment?: number;
}): ScaleResult & { baseScore: number; adjustment: number } {
  const baseScore = Object.entries(input.weights).reduce(
    (total, [id, weight]) =>
      total + (numericValue(input.answers[id]) > 0 ? weight : 0),
    0,
  );
  const adjustment = input.adjustment ?? 0;
  const score = baseScore + adjustment;
  return {
    baseScore,
    adjustment,
    score,
    scoreText:
      adjustment > 0
        ? `${score} (comorbidades ${baseScore} + idade ${adjustment})`
        : String(score),
    ...classifyRange(input.ranges, score),
  };
}

export function charlsonAgeAdjustment(age: unknown): number {
  const value = Number.parseFloat(String(age ?? ""));
  if (!Number.isFinite(value) || value < 50) return 0;
  return Math.min(4, Math.floor((value - 50) / 10) + 1);
}

export interface MnaSfResult extends ScaleResult {
  anthropometrySource: "bmi" | "calf" | null;
  anthropometryPoints: number | null;
}

export function scoreMnaSf(input: {
  answers: Record<string, unknown>;
  ranges: ScoreRange[];
  bmi?: number | null;
  calfCm?: number | null;
}): MnaSfResult {
  const baseScore = sumAnswers(["n1", "n2", "n3", "n4", "n5"], input.answers);

  let anthropometrySource: "bmi" | "calf" | null = null;
  let anthropometryPoints: number | null = null;

  const bmi = input.bmi ?? null;
  const calf = input.calfCm ?? null;

  if (typeof bmi === "number" && Number.isFinite(bmi) && bmi > 0) {
    anthropometrySource = "bmi";
    anthropometryPoints = bmi < 19 ? 0 : bmi < 21 ? 1 : bmi < 23 ? 2 : 3;
  } else if (typeof calf === "number" && Number.isFinite(calf) && calf > 0) {
    anthropometrySource = "calf";
    anthropometryPoints = calf < 31 ? 0 : 3;
  }

  if (anthropometryPoints === null) {
    return {
      score: null,
      scoreText: "—",
      classe: "Aguardando antropometria",
      cor: "cinza",
      texto: "Informe IMC ou, quando o IMC não puder ser calculado, a circunferência da panturrilha.",
      anthropometrySource,
      anthropometryPoints,
    };
  }

  const score = baseScore + anthropometryPoints;
  return {
    score,
    scoreText: String(score),
    ...classifyRange(input.ranges, score),
    anthropometrySource,
    anthropometryPoints,
  };
}
export function scoreDiscreteNumeric(input: {
  raw: unknown;
  allowedValues: readonly number[];
  ranges: ScoreRange[];
  unit?: string;
}): ScaleResult {
  const rawString = String(input.raw ?? "").trim();
  const value = Number.parseFloat(rawString);
  if (rawString === "" || Number.isNaN(value)) {
    return { score: null, scoreText: "—", classe: "Aguardando seleção", cor: "cinza", texto: "Selecione um valor válido." };
  }
  if (!input.allowedValues.includes(value)) {
    return { score: value, scoreText: String(value), classe: "Valor não permitido", cor: "cinza", texto: "O valor não corresponde a uma opção válida desta versão da escala." };
  }
  return {
    score: value,
    scoreText: `${value}${input.unit ? ` ${input.unit}` : ""}`,
    ...classifyRange(input.ranges, value),
  };
}

export interface EsasResult extends ScaleResult {
  maxSymptomScore: number;
  urgentSymptoms: string[];
}

export function scoreEsas(input: {
  itemIds: readonly string[];
  answers: Record<string, unknown>;
  ranges: ScoreRange[];
  urgentThreshold?: number;
}): EsasResult {
  const threshold = input.urgentThreshold ?? 7;
  const values = input.itemIds.map((id) => {
    const raw = input.answers[id];
    const value = numericValue(raw);
    return { id, value: Math.max(0, Math.min(10, value)) };
  });
  const score = values.reduce((total, item) => total + item.value, 0);
  const urgentSymptoms = values.filter((item) => item.value >= threshold).map((item) => item.id);
  return {
    score,
    scoreText: String(score),
    ...classifyRange(input.ranges, score),
    maxSymptomScore: Math.max(0, ...values.map((item) => item.value)),
    urgentSymptoms,
  };
}

