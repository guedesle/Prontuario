export type CognitiveQuickCode = "meem" | "moca";

export type CognitiveQuickField = {
  id: "score" | "educationYears";
  label: string;
  number: { min: number; max: number; step: number; help: string };
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

const commonFields: readonly CognitiveQuickField[] = [
  {
    id: "score",
    label: "Pontuação obtida",
    number: { min: 0, max: 30, step: 1, help: "Registre somente o resultado numérico de 0 a 30 do instrumento já aplicado." },
  },
  {
    id: "educationYears",
    label: "Anos completos de escolaridade",
    number: { min: 0, max: 40, step: 1, help: "Informe anos completos de estudo formal para contextualizar o resultado." },
  },
];

export const COGNITIVE_QUICK_DEFINITIONS: readonly CognitiveQuickDefinition[] = [
  {
    code: "meem",
    version: "meem-brucki-context-2026-08-v2",
    name: "MEEM — pontuação e escolaridade",
    dimension: "cognicao",
    instruction: "Registre somente a pontuação do MEEM já aplicado e os anos completos de escolaridade. O sistema compara o resultado com medianas educacionais brasileiras apenas para contexto clínico.",
    sourceNote: "Brucki et al., 2003 (PMID 14595482): medianas de referência por escolaridade em adultos saudáveis. As medianas são contexto educacional, não pontos diagnósticos. O rastreio não estabelece diagnóstico.",
    fields: commonFields,
  },
  {
    code: "moca",
    version: "moca-br-education-2019-2026-08-v2",
    name: "MoCA — pontuação e escolaridade",
    dimension: "cognicao",
    instruction: "Registre a pontuação bruta do MoCA já aplicado e os anos completos de escolaridade. O servidor aplica +1 ponto quando a escolaridade é menor ou igual a 12 anos, limitado a 30.",
    sourceNote: "Memória et al., 2019 (PMID 31043963): referências educacionais brasileiras em pessoas com pelo menos 4 anos de escolaridade. Abaixo de 4 anos o sistema não gera ponto de corte automático. O rastreio não estabelece diagnóstico.",
    fields: commonFields,
  },
];

function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} inválido.`);
  }
  return value;
}

function meemMedian(educationYears: number): number {
  if (educationYears === 0) return 20;
  if (educationYears <= 4) return 25;
  if (educationYears <= 8) return 26.5;
  if (educationYears <= 11) return 28;
  return 29;
}

export function scoreCognitiveQuickEntry(
  code: CognitiveQuickCode,
  raw: Record<string, unknown>,
): { answers: { score: number; educationYears: number }; result: CognitiveQuickResult; version: string } {
  const definition = COGNITIVE_QUICK_DEFINITIONS.find((item) => item.code === code);
  if (!definition) throw new Error("Registro cognitivo rápido não disponível.");
  const allowed = new Set(["score", "educationYears"]);
  if (Object.keys(raw).some((key) => !allowed.has(key))) throw new Error("Campo não permitido no registro cognitivo rápido.");

  const score = integer(raw.score, "Pontuação", 0, 30);
  const educationYears = integer(raw.educationYears, "Escolaridade", 0, 40);
  const answers = { score, educationYears };

  if (code === "meem") {
    const median = meemMedian(educationYears);
    const relation = score < median ? "abaixo" : score === median ? "igual" : "acima";
    return {
      answers,
      version: definition.version,
      result: {
        score,
        scoreText: `${score}/30`,
        classification: "Referência educacional contextual",
        interpretation: `MEEM ${score}/30, ${relation} da mediana de referência educacional de ${median}/30 descrita por Brucki et al. Essa mediana é apenas contextual e não constitui ponto diagnóstico. O rastreio deve ser integrado à funcionalidade, escolaridade, humor, sono, condições sensoriais e avaliação clínica.`,
        clinicalColor: "cinza",
      },
    };
  }

  const correction = educationYears <= 12 ? 1 : 0;
  const adjusted = Math.min(30, score + correction);
  const prefix = `MoCA bruto ${score}/30; correção educacional +${correction}; resultado corrigido ${adjusted}/30.`;

  if (educationYears < 4) {
    return {
      answers,
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
    answers,
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
