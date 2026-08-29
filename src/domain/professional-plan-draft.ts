export type ProfessionalPlanDraftSuggestion = {
  problemId: string;
  actions: readonly string[];
};

export function buildProfessionalPlanDraft({
  savedPlanByProblem,
  suggestions,
  seedSuggestions,
}: {
  savedPlanByProblem?: Record<string, readonly string[]>;
  suggestions?: readonly ProfessionalPlanDraftSuggestion[];
  seedSuggestions: boolean;
}): Record<string, string> {
  const draft = Object.fromEntries(
    Object.entries(savedPlanByProblem ?? {}).map(([problemId, actions]) => [problemId, actions.join("\n")]),
  );

  if (!seedSuggestions) return draft;

  for (const suggestion of suggestions ?? []) {
    if ((draft[suggestion.problemId] ?? "").trim()) continue;
    const actions = suggestion.actions.map((action) => action.trim()).filter(Boolean);
    if (actions.length > 0) draft[suggestion.problemId] = actions.join("\n");
  }

  return draft;
}
