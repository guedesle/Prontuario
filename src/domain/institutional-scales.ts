import { classifyRange, type ScaleResult } from "./clinical-engine.ts";
import { ZARIT_PALLIATIVE_7_MS2013 } from "./clinical-config/institutional-scales.ts";

function strictItemSum(input: {
  itemIds: readonly string[];
  answers: Record<string, unknown>;
  allowedValues: readonly number[];
}): number | null {
  let total = 0;
  for (const id of input.itemIds) {
    if (!(id in input.answers)) return null;
    const raw = input.answers[id];
    const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
    if (!Number.isFinite(value) || !input.allowedValues.includes(value)) return null;
    total += value;
  }
  return total;
}

export function scoreZaritPalliative7(answers: Record<string, unknown>): ScaleResult {
  const score = strictItemSum({
    itemIds: ZARIT_PALLIATIVE_7_MS2013.itemIds,
    answers,
    allowedValues: ZARIT_PALLIATIVE_7_MS2013.allowedItemValues,
  });

  if (score === null) {
    return {
      score: null,
      scoreText: "—",
      classe: "Avaliação incompleta",
      cor: "cinza",
      texto: "Responder os sete itens usando apenas valores de 1 a 5.",
    };
  }

  if (score === ZARIT_PALLIATIVE_7_MS2013.sourceGapScore) {
    return {
      score,
      scoreText: String(score),
      classe: "Ponto de corte não definido na fonte",
      cor: "cinza",
      texto: "O material institucional classifica 15-21 como moderada e acima de 22 como grave, sem atribuir categoria explícita ao escore 22. Requer revisão antes da interpretação automática.",
    };
  }

  return {
    score,
    scoreText: String(score),
    ...classifyRange(ZARIT_PALLIATIVE_7_MS2013.ranges, score),
  };
}
