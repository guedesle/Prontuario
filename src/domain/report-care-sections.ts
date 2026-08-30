import { parsePlanNote } from "./consultation-note-contract.ts";
import { gastrostomyFamilyGuidance } from "./family-contextual-care.ts";

export interface ReportProblemInput {
  id: string;
  title: string;
}

export interface AgaReportClinicalConduct {
  problemId: string;
  problemTitle: string;
  actions: string[];
}

export interface AgaReportGastrostomyCare {
  practicalActions: string[];
  caregiverActions: string[];
  contactGuidance: string[];
}

export interface AgaReportCareSections {
  clinicalConducts: AgaReportClinicalConduct[];
  gastrostomyCare?: AgaReportGastrostomyCare;
}

function savedPlanByProblem(value: unknown): Readonly<Record<string, readonly string[]>> | undefined {
  try {
    return parsePlanNote(value)?.byProblem;
  } catch {
    // Relatórios antigos podem conter JSON legado. Não reinterpretar conteúdo ambíguo.
    return undefined;
  }
}

export function buildAgaReportCareSections(input: {
  gastrostomyPresent: boolean;
  savedPlan: unknown;
  problems: readonly ReportProblemInput[];
}): AgaReportCareSections {
  const problemById = new Map(input.problems.map((problem) => [problem.id, problem]));
  const planByProblem = savedPlanByProblem(input.savedPlan);
  const clinicalConducts = Object.entries(planByProblem ?? {}).flatMap(([problemId, actions]) => {
    const problem = problemById.get(problemId);
    if (!problem) return [];
    const normalizedActions = [...new Set(actions.map((action) => action.trim()).filter(Boolean))];
    if (normalizedActions.length === 0) return [];
    return [{
      problemId,
      problemTitle: problem.title,
      actions: normalizedActions,
    }];
  });

  const gastrostomyGuidance = input.gastrostomyPresent ? gastrostomyFamilyGuidance() : undefined;

  return {
    clinicalConducts,
    ...(gastrostomyGuidance ? {
      gastrostomyCare: {
        practicalActions: [...gastrostomyGuidance.now],
        caregiverActions: [...gastrostomyGuidance.caregiver],
        contactGuidance: [...gastrostomyGuidance.contact],
      },
    } : {}),
  };
}
