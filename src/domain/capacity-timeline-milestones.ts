import { isProblemLogicalDeletionNote } from "./as-of-consultation.ts";
import type { CapacityTimelineMilestone } from "./capacity-dimension-history.ts";

export interface CapacityMilestoneProblem {
  patientId: string;
  originConsultationId: string;
  title: string;
  description?: string | null;
  createdAt: Date | string;
  events: readonly {
    patientId: string;
    consultationId: string;
    note?: string | null;
    createdAt: Date | string;
  }[];
}

/** Converte somente fatos clínicos documentados em contexto temporal do gráfico. */
export function buildProblemCapacityMilestones(input: {
  patientId: string;
  problems: readonly CapacityMilestoneProblem[];
  consultationIds?: readonly string[];
}): CapacityTimelineMilestone[] {
  if (input.problems.some((problem) => problem.patientId !== input.patientId)) {
    throw new Error("Marcos clínicos não podem misturar pacientes diferentes.");
  }
  const eligible = input.consultationIds ? new Set(input.consultationIds) : null;

  return input.problems.flatMap((problem) => {
    const items: CapacityTimelineMilestone[] = [];
    if (problem.events.some((event) => isProblemLogicalDeletionNote(event.note))) return items;
    const originNote = problem.description?.trim();
    if ((!eligible || eligible.has(problem.originConsultationId)) && originNote) {
      items.push({
        patientId: problem.patientId,
        consultationId: problem.originConsultationId,
        title: problem.title,
        note: originNote,
        recordedAt: problem.createdAt,
        source: "problem-origin",
      });
    }
    for (const event of problem.events) {
      if (event.patientId !== input.patientId) throw new Error("Evento clínico pertence a outro paciente.");
      const note = event.note?.trim();
      if (!note || isProblemLogicalDeletionNote(note) || (eligible && !eligible.has(event.consultationId))) continue;
      items.push({
        patientId: event.patientId,
        consultationId: event.consultationId,
        title: problem.title,
        note,
        recordedAt: event.createdAt,
        source: "problem-event",
      });
    }
    return items;
  });
}
