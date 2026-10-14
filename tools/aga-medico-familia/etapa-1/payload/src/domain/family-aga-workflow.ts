/**
 * Contrato de APRESENTAÇÃO da primeira jornada AGA — Médico da Família.
 * Os cinco slots de escalas ainda não representam instrumentos clínicos.
 * Nenhuma regra de pontuação, alerta, internação ou encaminhamento é calculada aqui.
 */
export const FAMILY_AGA_STAGES = [
  { id: "contexto", title: "Identificação e contexto", description: "Conferência de identidade, histórico e motivo da consulta." },
  { id: "coleta", title: "Coleta clínica", description: "Registro dos dados obtidos durante a consulta de rotina." },
  { id: "escalas", title: "Cinco escalas AGA", description: "Aplicação dos cinco instrumentos após validação clínica." },
  { id: "revisao", title: "Revisão de achados", description: "Análise clínica de achados relevantes e possíveis sinais de alerta." },
  { id: "compartilhada", title: "Avaliação compartilhada", description: "Discussão com o geriatra quando indicada, preservando a participação do médico da família." },
  { id: "sintese", title: "Síntese e continuidade", description: "Registro da conduta, comunicação e encaminhamento quando indicado." },
] as const;

export const FAMILY_AGA_SCALE_SLOTS = [
  { id: "escala-1", title: "Instrumento 1 — a definir" },
  { id: "escala-2", title: "Instrumento 2 — a definir" },
  { id: "escala-3", title: "Instrumento 3 — a definir" },
  { id: "escala-4", title: "Instrumento 4 — a definir" },
  { id: "escala-5", title: "Instrumento 5 — a definir" },
] as const;

export type FamilyAgaStageId = (typeof FAMILY_AGA_STAGES)[number]["id"];
export type FamilyAgaScaleId = (typeof FAMILY_AGA_SCALE_SLOTS)[number]["id"];

/** Cinco etapas de percurso + cinco avaliações: cada item tem peso idêntico. */
export function computeFamilyAgaProgress(
  completedStages: readonly string[],
  completedScales: readonly string[],
) {
  const completedStageSet = new Set(completedStages);
  const completedScaleSet = new Set(completedScales);
  const scaleCount = FAMILY_AGA_SCALE_SLOTS.filter((scale) => completedScaleSet.has(scale.id)).length;
  const stageCount = FAMILY_AGA_STAGES.filter((stage) => stage.id !== "escalas" && completedStageSet.has(stage.id)).length;
  const completed = stageCount + scaleCount;
  const total = FAMILY_AGA_STAGES.length - 1 + FAMILY_AGA_SCALE_SLOTS.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
    stagesCompleted: stageCount + (scaleCount === FAMILY_AGA_SCALE_SLOTS.length ? 1 : 0),
    stagesTotal: FAMILY_AGA_STAGES.length,
    scalesCompleted: scaleCount,
    scalesTotal: FAMILY_AGA_SCALE_SLOTS.length,
  };
}
