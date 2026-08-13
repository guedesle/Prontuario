export type ProblemType = "CLINICAL" | "GERIATRIC";
export type ProblemStatus = "ACTIVE" | "STABLE" | "MONITORING" | "RESOLVED";

export interface ClinicalProblem {
  id: string;
  patientId: string;
  type: ProblemType;
  status: ProblemStatus;
  title: string;
  description?: string;
  priority?: number;
}

export function activeProblems(
  problems: ClinicalProblem[],
): ClinicalProblem[] {
  return problems
    .filter((problem) => problem.status !== "RESOLVED")
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function splitProblems(problems: ClinicalProblem[]) {
  return {
    clinical: problems.filter((p) => p.type === "CLINICAL"),
    geriatric: problems.filter((p) => p.type === "GERIATRIC"),
  };
}
