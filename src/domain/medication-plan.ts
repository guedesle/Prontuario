export type MedicationMoment =
  | "manha"
  | "almoco"
  | "tarde"
  | "noite"
  | "ao_deitar"
  | "se_necessario";

export interface MedicationPlanItem {
  id: string;
  medicationText: string;
  doseInstruction?: string;
  route?: string;
  moments: readonly MedicationMoment[];
  instructions?: string;
  continuous?: boolean;
}

export const MEDICATION_MOMENTS: readonly MedicationMoment[] = [
  "manha",
  "almoco",
  "tarde",
  "noite",
  "ao_deitar",
  "se_necessario",
];

export const MEDICATION_MOMENT_LABELS: Readonly<Record<MedicationMoment, string>> = {
  manha: "Manhã",
  almoco: "Almoço",
  tarde: "Tarde",
  noite: "Noite",
  ao_deitar: "Ao deitar",
  se_necessario: "Se necessário",
};

function normalizedForSemanticValidation(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

const FREQUENCY_OR_SCHEDULE_PATTERNS: readonly RegExp[] = [
  /\b\d+\s*x\s*(?:\/|por\s+)?\s*(?:dia|d)\b/,
  /\b\d+\s*ve(?:z|zes)\s*(?:ao|por)\s*dia\b/,
  /\bmanha\s*(?:e|\/|\+)\s*noite\b/,
  /\bao\s+deitar\b/,
  /\bse\s+necessario\b/,
  /\b(?:manha|almoco|tarde|noite)\b/,
];

export function cleanMedicationText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function assertMedicationTextContainsNoSchedule(value: string): void {
  const normalized = normalizedForSemanticValidation(value);
  if (FREQUENCY_OR_SCHEDULE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new Error(
      "O texto do medicamento deve conter somente nome e dose/apresentação; selecione os horários nos campos estruturados.",
    );
  }
}

export function validateMedicationPlanItem(item: MedicationPlanItem): MedicationPlanItem {
  const medicationText = cleanMedicationText(item.medicationText);
  if (!medicationText) throw new Error("Medicamento precisa de nome e dose/apresentação.");
  assertMedicationTextContainsNoSchedule(medicationText);

  const moments = [...new Set(item.moments)];
  if (moments.length === 0) throw new Error("Selecione ao menos um horário para o medicamento.");
  if (moments.some((moment) => !MEDICATION_MOMENTS.includes(moment))) {
    throw new Error("Horário de medicamento inválido.");
  }

  return {
    ...item,
    medicationText,
    doseInstruction: cleanMedicationText(item.doseInstruction ?? "") || undefined,
    route: cleanMedicationText(item.route ?? "") || undefined,
    instructions: item.instructions?.trim() || undefined,
    moments,
  };
}

export function validateMedicationPlan(
  items: readonly MedicationPlanItem[],
): MedicationPlanItem[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (seen.has(item.id)) throw new Error(`Medicamento duplicado no plano: ${item.id}`);
    seen.add(item.id);
    return validateMedicationPlanItem(item);
  });
}

export function renderMedicationPlanText(
  patientName: string,
  items: readonly MedicationPlanItem[],
): string {
  const validItems = validateMedicationPlan(items);
  const lines = [`PLANO DE MEDICAMENTOS — ${patientName}`];

  for (const item of validItems) {
    const details = [item.doseInstruction, item.route, item.continuous ? "uso contínuo" : undefined]
      .filter(Boolean)
      .join(" · ");
    lines.push("", `- ${item.medicationText}${details ? ` — ${details}` : ""}`);
    lines.push(
      MEDICATION_MOMENTS
        .map((moment) => `${item.moments.includes(moment) ? "[x]" : "[ ]"} ${MEDICATION_MOMENT_LABELS[moment]}`)
        .join("  "),
    );
    if (item.instructions) lines.push(`  ${item.instructions}`);
  }

  return lines.join("\n");
}
