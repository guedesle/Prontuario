export type MedicationMoment =
  | "manha"
  | "almoco"
  | "tarde"
  | "noite"
  | "ao_deitar"
  | "se_necessario";

export type MedicationFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "AS_NEEDED";

export type MedicationSchedule =
  | { kind: "WEEKLY"; dayOfWeek?: number }
  | { kind: "MONTHLY"; dayOfMonth?: number; note?: string };

export interface MedicationPlanItem {
  id: string;
  medicationText: string;
  doseInstruction?: string;
  route?: string;
  frequency?: MedicationFrequency;
  schedule?: MedicationSchedule;
  needsScheduleReview?: boolean;
  moments: readonly MedicationMoment[];
  instructions?: string;
  continuous?: boolean;
}

export interface MedicationPlanRow {
  id: string;
  medicationText: string;
  doseInstruction?: string;
  route?: string;
  frequency: MedicationFrequency;
  frequencyLabel: string;
  scheduleLabel?: string;
  needsScheduleReview: boolean;
  instructions?: string;
  continuous: boolean;
  moments: Readonly<Record<MedicationMoment, boolean>>;
}

export interface MedicationPlanViewModel {
  patientName: string;
  rows: MedicationPlanRow[];
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

export const MEDICATION_FREQUENCY_LABELS: Readonly<Record<MedicationFrequency, string>> = {
  DAILY: "Todos os dias",
  WEEKLY: "1 vez por semana",
  MONTHLY: "1 vez por mês",
  AS_NEEDED: "Se necessário",
};

export const MEDICATION_DAY_OF_WEEK_LABELS: Readonly<Record<number, string>> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
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

function normalizePatientDisplayName(value: string): string {
  if (/\r|\n/.test(value)) {
    throw new Error("Nome do paciente inválido para exibição no plano de medicamentos.");
  }

  const patientName = value.trim().replace(/\s+/g, " ");
  if (!patientName) {
    throw new Error("O plano de medicamentos precisa estar vinculado a um paciente identificado.");
  }

  return patientName;
}

export function assertMedicationTextContainsNoSchedule(value: string): void {
  const normalized = normalizedForSemanticValidation(value);
  if (FREQUENCY_OR_SCHEDULE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new Error(
      "O texto do medicamento deve conter somente nome e dose/apresentação; selecione frequência e horários nos campos estruturados.",
    );
  }
}

export function normalizeMedicationFrequency(value: unknown, moments: readonly MedicationMoment[] = []): MedicationFrequency {
  if (value === "DAILY" || value === "WEEKLY" || value === "MONTHLY" || value === "AS_NEEDED") return value;
  return moments.length === 1 && moments[0] === "se_necessario" ? "AS_NEEDED" : "DAILY";
}

export function normalizeMedicationSchedule(value: unknown): MedicationSchedule | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (record.kind === "WEEKLY") {
    const dayOfWeek = typeof record.dayOfWeek === "number" && Number.isInteger(record.dayOfWeek) && record.dayOfWeek >= 0 && record.dayOfWeek <= 6
      ? record.dayOfWeek
      : undefined;
    return dayOfWeek === undefined ? { kind: "WEEKLY" } : { kind: "WEEKLY", dayOfWeek };
  }
  if (record.kind === "MONTHLY") {
    const dayOfMonth = typeof record.dayOfMonth === "number" && Number.isInteger(record.dayOfMonth) && record.dayOfMonth >= 1 && record.dayOfMonth <= 31
      ? record.dayOfMonth
      : undefined;
    const note = typeof record.note === "string" ? cleanMedicationText(record.note).slice(0, 160) || undefined : undefined;
    return {
      kind: "MONTHLY",
      ...(dayOfMonth === undefined ? {} : { dayOfMonth }),
      ...(note === undefined ? {} : { note }),
    };
  }
  return undefined;
}

export function medicationScheduleNeedsReview(
  frequency: MedicationFrequency,
  schedule?: MedicationSchedule,
): boolean {
  if (frequency === "WEEKLY") return schedule?.kind !== "WEEKLY" || schedule.dayOfWeek === undefined;
  if (frequency === "MONTHLY") {
    return schedule?.kind !== "MONTHLY" || (schedule.dayOfMonth === undefined && !schedule.note?.trim());
  }
  return false;
}

export function medicationScheduleLabel(
  frequency: MedicationFrequency,
  schedule?: MedicationSchedule,
): string | undefined {
  if (frequency === "WEEKLY") {
    return schedule?.kind === "WEEKLY" && schedule.dayOfWeek !== undefined
      ? MEDICATION_DAY_OF_WEEK_LABELS[schedule.dayOfWeek]
      : "Dia da semana não definido";
  }
  if (frequency === "MONTHLY") {
    if (schedule?.kind !== "MONTHLY") return "Dia/programação mensal não definida";
    if (schedule.dayOfMonth !== undefined) return `Dia ${schedule.dayOfMonth} de cada mês`;
    if (schedule.note) return schedule.note;
    return "Dia/programação mensal não definida";
  }
  return undefined;
}

export function validateMedicationPlanItem(item: MedicationPlanItem): MedicationPlanItem {
  const medicationText = cleanMedicationText(item.medicationText);
  if (!medicationText) throw new Error("Medicamento precisa de nome e dose/apresentação.");
  assertMedicationTextContainsNoSchedule(medicationText);

  const moments = [...new Set(item.moments)];
  if (moments.some((moment) => !MEDICATION_MOMENTS.includes(moment))) {
    throw new Error("Horário de medicamento inválido.");
  }

  const frequency = normalizeMedicationFrequency(item.frequency, moments);
  if (frequency === "DAILY" && moments.length === 0) {
    throw new Error("Selecione ao menos um horário para o medicamento de uso diário.");
  }
  if (frequency === "AS_NEEDED" && moments.some((moment) => moment !== "se_necessario")) {
    throw new Error("Frequência 'se necessário' deve usar somente o horário estruturado 'Se necessário'.");
  }

  const normalizedMoments = frequency === "AS_NEEDED" && moments.length === 0
    ? ["se_necessario" as const]
    : moments;
  const schedule = normalizeMedicationSchedule(item.schedule);
  const needsScheduleReview = item.needsScheduleReview === true || medicationScheduleNeedsReview(frequency, schedule);

  return {
    ...item,
    medicationText,
    doseInstruction: cleanMedicationText(item.doseInstruction ?? "") || undefined,
    route: cleanMedicationText(item.route ?? "") || undefined,
    frequency,
    schedule,
    needsScheduleReview,
    instructions: item.instructions?.trim() || undefined,
    moments: normalizedMoments,
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

export function buildMedicationPlanRows(
  items: readonly MedicationPlanItem[],
): MedicationPlanRow[] {
  return validateMedicationPlan(items).map((item) => {
    const frequency = normalizeMedicationFrequency(item.frequency, item.moments);
    return {
      id: item.id,
      medicationText: item.medicationText,
      doseInstruction: item.doseInstruction,
      route: item.route,
      frequency,
      frequencyLabel: MEDICATION_FREQUENCY_LABELS[frequency],
      scheduleLabel: medicationScheduleLabel(frequency, item.schedule),
      needsScheduleReview: item.needsScheduleReview === true,
      instructions: item.instructions,
      continuous: item.continuous === true,
      moments: Object.fromEntries(
        MEDICATION_MOMENTS.map((moment) => [moment, item.moments.includes(moment)]),
      ) as Record<MedicationMoment, boolean>,
    };
  });
}

export function buildMedicationPlanViewModel(
  patientName: string,
  items: readonly MedicationPlanItem[],
): MedicationPlanViewModel {
  return {
    patientName: normalizePatientDisplayName(patientName),
    rows: buildMedicationPlanRows(items),
  };
}

export function renderMedicationPlanText(
  patientName: string,
  items: readonly MedicationPlanItem[],
): string {
  const model = buildMedicationPlanViewModel(patientName, items);
  const lines = [`PLANO DE MEDICAMENTOS — ${model.patientName}`];

  for (const row of model.rows) {
    const details = [row.doseInstruction, row.route, row.continuous ? "uso contínuo" : undefined]
      .filter(Boolean)
      .join(" · ");
    lines.push("", `- ${row.medicationText}${details ? ` — ${details}` : ""}`);
    lines.push(`  Frequência: ${row.frequencyLabel}${row.scheduleLabel ? ` · ${row.scheduleLabel}` : ""}`);
    if (row.needsScheduleReview) lines.push("  ATENÇÃO: programação incompleta — revisar antes de compartilhar o plano.");

    if (row.frequency === "DAILY" || row.frequency === "AS_NEEDED") {
      lines.push(
        MEDICATION_MOMENTS
          .map((moment) => `${row.moments[moment] ? "[x]" : "[ ]"} ${MEDICATION_MOMENT_LABELS[moment]}`)
          .join("  "),
      );
    } else {
      const selectedMoments = MEDICATION_MOMENTS.filter((moment) => row.moments[moment]);
      if (selectedMoments.length > 0) {
        lines.push(`  Horário no dia: ${selectedMoments.map((moment) => MEDICATION_MOMENT_LABELS[moment]).join(", ")}`);
      }
    }
    if (row.instructions) lines.push(`  ${row.instructions}`);
  }

  return lines.join("\n");
}
