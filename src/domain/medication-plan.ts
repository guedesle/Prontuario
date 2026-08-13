export type MedicationMoment = "manha" | "almoco" | "tarde" | "noite" | "ao_deitar" | "se_necessario" | "outro";

export interface MedicationPlanItem {
  id: string;
  name: string;
  presentation?: string;
  dose: string;
  route?: string;
  moment: MedicationMoment;
  instructions?: string;
  continuous?: boolean;
}

export interface MedicationPlanGroup {
  moment: MedicationMoment;
  label: string;
  items: MedicationPlanItem[];
}

const MOMENT_ORDER: MedicationMoment[] = ["manha", "almoco", "tarde", "noite", "ao_deitar", "se_necessario", "outro"];
const MOMENT_LABELS: Record<MedicationMoment, string> = {
  manha: "Manhã",
  almoco: "Almoço",
  tarde: "Tarde",
  noite: "Noite",
  ao_deitar: "Ao deitar",
  se_necessario: "Se necessário",
  outro: "Outro horário",
};

export function groupMedicationPlan(items: readonly MedicationPlanItem[]): MedicationPlanGroup[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Medicamento duplicado no plano: ${item.id}`);
    seen.add(item.id);
    if (!item.name.trim() || !item.dose.trim()) throw new Error("Medicamento precisa de nome e dose.");
  }

  return MOMENT_ORDER
    .map((moment) => ({
      moment,
      label: MOMENT_LABELS[moment],
      items: items.filter((item) => item.moment === moment),
    }))
    .filter((group) => group.items.length > 0);
}

export function renderMedicationPlanText(patientName: string, items: readonly MedicationPlanItem[]): string {
  const groups = groupMedicationPlan(items);
  const lines = [`PLANO DE MEDICAMENTOS — ${patientName}`];
  for (const group of groups) {
    lines.push("", group.label.toUpperCase());
    for (const item of group.items) {
      const presentation = item.presentation ? ` ${item.presentation}` : "";
      const route = item.route ? ` · ${item.route}` : "";
      const continuous = item.continuous ? " · uso contínuo" : "";
      lines.push(`- ${item.name}${presentation}: ${item.dose}${route}${continuous}`);
      if (item.instructions?.trim()) lines.push(`  ${item.instructions.trim()}`);
    }
  }
  return lines.join("\n");
}
