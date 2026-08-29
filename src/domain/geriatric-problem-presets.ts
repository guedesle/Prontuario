export const GERIATRIC_PROBLEM_PRESETS = [
  "Fragilidade",
  "Comprometimento cognitivo",
  "Imobilidade",
  "Restrição da mobilidade",
  "Comprometimento multissensorial",
  "Lesão por pressão",
  "Sarcopenia",
  "Desnutrição",
  "Delirium",
  "Transtorno do humor",
  "Ansiedade",
  "Polifarmácia (>5 medicações)",
  "Incontinência urinária",
  "Incontinência fecal",
  "Queda",
] as const;

export type GeriatricProblemPreset = typeof GERIATRIC_PROBLEM_PRESETS[number];
