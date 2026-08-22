import { scoreComplementaryScale } from "./complementary-score-scales.ts";

export const SARCF_STRUCTURED_CODE = "sarcf" as const;
export const SARCF_STRUCTURED_VERSION = "sarcf-structured-2026-08-v1" as const;

const DIFFICULTY_CHOICES = [
  { value: 0, label: "Nenhuma dificuldade — 0" },
  { value: 1, label: "Alguma dificuldade — 1" },
  { value: 2, label: "Muita dificuldade ou incapaz — 2" },
] as const;

export const SARCF_STRUCTURED_DEFINITION = {
  code: SARCF_STRUCTURED_CODE,
  version: SARCF_STRUCTURED_VERSION,
  name: "SARC-F",
  dimension: "mobilidade",
  instruction: "Marque uma resposta em cada um dos cinco itens. O escore total é calculado automaticamente.",
  applicationGuide: [
    {
      title: "Leitura clínica",
      items: [
        "0–3: rastreio negativo.",
        "4–10: rastreio positivo para risco de sarcopenia; confirmar em avaliação clínica.",
      ],
    },
  ],
  sourceNote: "SARC-F: cinco domínios, total 0–10. Corte de rastreio ≥4 preservado do golden master; não confirma sarcopenia isoladamente.",
  fields: [
    {
      id: "strength",
      label: "Força — dificuldade para levantar e carregar cerca de 4,5 kg",
      choices: DIFFICULTY_CHOICES,
    },
    {
      id: "walking",
      label: "Assistência para caminhar — dificuldade para atravessar um cômodo",
      choices: DIFFICULTY_CHOICES,
    },
    {
      id: "chair",
      label: "Levantar da cadeira — dificuldade para levantar-se de cadeira ou cama",
      choices: DIFFICULTY_CHOICES,
    },
    {
      id: "stairs",
      label: "Subir escadas — dificuldade para subir 10 degraus",
      choices: DIFFICULTY_CHOICES,
    },
    {
      id: "falls",
      label: "Quedas no último ano",
      choices: [
        { value: 0, label: "Nenhuma — 0" },
        { value: 1, label: "1 a 3 quedas — 1" },
        { value: 2, label: "4 ou mais quedas — 2" },
      ],
    },
  ],
} as const;

function answer(raw: Record<string, unknown>, id: string): number {
  const value = raw[id];
  if (typeof value !== "number" || ![0, 1, 2].includes(value)) {
    throw new Error(`SARC-F inválido: ${id}.`);
  }
  return value;
}

export function scoreSarcfStructured(raw: Record<string, unknown>) {
  const answers = {
    strength: answer(raw, "strength"),
    walking: answer(raw, "walking"),
    chair: answer(raw, "chair"),
    stairs: answer(raw, "stairs"),
    falls: answer(raw, "falls"),
  };
  const score = answers.strength + answers.walking + answers.chair + answers.stairs + answers.falls;
  const legacy = scoreComplementaryScale("sarcf", { score });
  return {
    answers,
    result: legacy.result,
    version: SARCF_STRUCTURED_VERSION,
  };
}
