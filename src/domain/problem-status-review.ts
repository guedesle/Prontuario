export type ProblemStatus = "ACTIVE" | "STABLE" | "MONITORING" | "RESOLVED";

export function canSubmitProblemStatusChange(input: {
  editable: boolean;
  saving: boolean;
  currentStatus: ProblemStatus;
  nextStatus: ProblemStatus;
  reviewConfirmed: boolean;
}): boolean {
  return Boolean(
    input.editable
      && !input.saving
      && input.currentStatus !== input.nextStatus
      && input.reviewConfirmed,
  );
}
