export const GERIATRIC_PROBLEM_PRESETS = [
  "Fragilidade",
  "Sarcopenia",
  "Quedas",
  "Comprometimento cognitivo e demência",
  "Delirium",
  "Incontinência urinária e fecal",
  "Imobilidade e dependência funcional",
  "Depressão e isolamento social",
  "Desnutrição/perda de peso não intencional e anorexia do envelhecimento",
  "Comprometimento multissensorial — perda visual, auditiva, olfativa, gustativa e tátil",
  "Polifarmácia — uso de ≥5 medicamentos",
  "Multimorbidade — presença de ≥2 condições crônicas",
  "Úlceras de pressão",
] as const;

export type GeriatricProblemPreset = typeof GERIATRIC_PROBLEM_PRESETS[number];
