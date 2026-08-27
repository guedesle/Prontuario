export type CognitiveQuickCode = "meem" | "moca";

export type CognitiveQuickField = {
  id: "score" | "educationYears" | "educationBand";
  label: string;
  number?: { min: number; max: number; step: number; help: string };
  choices?: readonly { value: string; label: string }[];
};

export type CognitiveQuickDefinition = {
  code: CognitiveQuickCode;
  version: string;
  name: string;
  dimension: "cognicao";
  instruction: string;
  sourceNote: string;
  fields: readonly CognitiveQuickField[];
};

export type CognitiveQuickResult = {
  score: number;
  scoreText: string;
  classification: string;
  interpretation: string;
  clinicalColor: "verde" | "amarelo" | "cinza";
};

const scoreField: CognitiveQuickField = {
  id: "score",
  label: "Pontuação obtida",
  number: { min: 0, max: 30, step: 1, help: "Registre somente o resultado numérico de 0 a 30 do instrumento já aplicado." },
};

export const MEEM_EDUCATION_BANDS = [
  { value: "0_4", label: "0–4 anos" },
  { value: "4_11", label: "4–11 anos" },
  { value: "gt_11", label: "> 11 anos" },
] as const;

const MEEM_SCREENING_THRESHOLDS: Readonly<Record<string, number>> = {
  "0_4": 22,
  "4_11": 23,
  "gt_11": 24,
};

export const COGNITIVE_QUICK_DEFINITIONS: readonly CognitiveQuickDefinition[] = [
  {
    code: "meem",
    version: "meem-br-education-screening-2026-08-v3",
    name: "MEEM — pontuação e escolaridade",
    dimension: "cognicao",
    instruction: "Registre a pontuação do MEEM já aplicado e selecione a faixa de escolaridade. O resultado é classificado como rastreio cognitivo e nunca como diagnóstico isolado.",
    sourceNote: "Referência de rastreio educacional: Kochhann et al., 2010 (PMID 29213658). O estudo original estratificou analfabetos, 1–5 anos, 6–11 anos e ≥12 anos, com pontos de corte 21/22/23/24. A interface 0–4, 4–11 e >11 anos e o mapeamento operacional 22/23/24 são uma padronização local do serviço solicitada para o prontuário, não uma reprodução literal das faixas do estudo. O resultado é rastreio e deve ser integrado à funcionalidade e à avaliação clínica; não estabelece diagnóstico isoladamente.",
    fields: [
      scoreField,
      {
        id: "educationBand",
        label: "Escolaridade",
        choices: MEEM_EDUCATION_BANDS,
      },
    ],
  },
  {
    code: "moca",
    version: "moca-br-education-2019-2026-08-v2",
    name: "MoCA — pontuação e escolaridade",
    dimension: "cognicao",
    instruction: "Registre a pontuação bruta do MoCA já aplicado e os anos completos de escolaridade. O servidor aplica +1 ponto quando a escolaridade é menor ou igual a 12 anos, limitado a 30.",
    sourceNote: "Memória et al., 2019 (PMID 31043963): referências educacionais brasileiras em pessoas com pelo menos 4 anos de escolaridade. Abaixo de 4 anos o sistema não gera ponto de corte automático. O rastreio não estabelece diagnóstico.",
    fields: [
      scoreField,
      {
        id: "educationYears",
        label: "Anos completos de escolaridade",
        number: { min: 0, max: 40, step: 1, help: "Informe anos completos de estudo formal para contextualizar o resultado." },
      },
    ],
  },
];

function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} inválido.`);
  }
  return value;
}

function meemEducationBand(raw: Record<string, unknown>): string {
  if (typeof raw.educationBand === "string" && raw.educationBand in MEEM_SCREENING_THRESHOLDS) {
    return raw.educationBand;
  }

  // Compatibilidade com chamadas antigas baseadas em anos completos.
  if (raw.educationYears !== undefined) {
    const years = integer(raw.educationYears, "Escolaridade", 0, 40);
    if (years <= 4) return "0_4";
    if (years <= 11) return "4_11";
    return "gt_11";
  }

  throw new Error("Escolaridade inválida.");
}

function educationBandLabel(value: string): string {
  return MEEM_EDUCATION_BANDS.find((item) => item.value === value)?.label ?? value;
}

export function scoreCognitiveQuickEntry(
  code: CognitiveQuickCode,
  raw: Record<string, unknown>,
): { answers: Record<string, number | string>; result: CognitiveQuickResult; version: string } {
  const definition = COGNITIVE_QUICK_DEFINITIONS.find((item) => item.code === code);
  if (!definition) throw new Error("Registro cognitivo rápido não disponível.");

  const score = integer(raw.score, "Pontuação", 0, 30);

  if (code === "meem") {
    const allowed = new Set(["score", "educationBand", "educationYears"]);
    if (Object.keys(raw).some((key) => !allowed.has(key))) throw new Error("Campo não permitido no registro cognitivo rápido.");
    const educationBand = meemEducationBand(raw);
    const threshold = MEEM_SCREENING_THRESHOLDS[educationBand]!;
    const altered = score < threshold;
    const label = educationBandLabel(educationBand);
    return {
      answers: { score, educationBand },
      version: definition.version,
      result: {
        score,
        scoreText: `${score}/30 · escolaridade ${label}`,
        classification: altered
          ? "Alteração cognitiva no rastreio pelo MEEM"
          : "Sem alteração cognitiva no rastreio pelo MEEM",
        interpretation: altered
          ? `MEEM ${score}/30, abaixo da referência de rastreio adotada (${threshold}/30) para a faixa ${label}. Resultado compatível com alteração cognitiva no rastreio e que requer correlação com funcionalidade, escolaridade, humor, sono, condições sensoriais e avaliação clínica; não estabelece diagnóstico isoladamente.`
          : `MEEM ${score}/30, na ou acima da referência de rastreio adotada (${threshold}/30) para a faixa ${label}. O resultado não exclui comprometimento cognitivo quando há queixa, declínio funcional ou outros achados clínicos.`,
        clinicalColor: altered ? "amarelo" : "verde",
      },
    };
  }

  const allowed = new Set(["score", "educationYears"]);
  if (Object.keys(raw).some((key) => !allowed.has(key))) throw new Error("Campo não permitido no registro cognitivo rápido.");
  const educationYears = integer(raw.educationYears, "Escolaridade", 0, 40);
  const correction = educationYears <= 12 ? 1 : 0;
  const adjusted = Math.min(30, score + correction);
  const prefix = `MoCA bruto ${score}/30; correção educacional +${correction}; resultado corrigido ${adjusted}/30.`;

  if (educationYears < 4) {
    return {
      answers: { score, educationYears },
      version: definition.version,
      result: {
        score: adjusted,
        scoreText: `Bruto ${score}/30 · corrigido ${adjusted}/30`,
        classification: "Sem ponto de corte automático para esta escolaridade",
        interpretation: `${prefix} A referência brasileira adotada não sustenta ponto de corte automático abaixo de 4 anos de escolaridade. Interpretar clinicamente, sem inferir diagnóstico pelo escore isolado.`,
        clinicalColor: "cinza",
      },
    };
  }

  const threshold = educationYears <= 12 ? 21 : 20;
  const altered = adjusted < threshold;
  return {
    answers: { score, educationYears },
    version: definition.version,
    result: {
      score: adjusted,
      scoreText: `Bruto ${score}/30 · corrigido ${adjusted}/30`,
      classification: altered ? "Abaixo da referência de rastreio educacional adotada" : "Na ou acima da referência de rastreio educacional adotada",
      interpretation: `${prefix} Para a faixa educacional registrada, a referência brasileira adotada usa ${threshold} pontos como limiar de rastreio. O resultado indica ${altered ? "necessidade de investigação cognitiva adicional" : "desempenho na ou acima da referência de rastreio"}, mas não estabelece diagnóstico.`,
      clinicalColor: altered ? "amarelo" : "verde",
    },
  };
}
