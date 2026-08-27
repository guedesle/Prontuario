export type VaccinationReviewStatus = "UNKNOWN" | "UP_TO_DATE" | "PENDING";

export interface VaccinationReview {
  status: VaccinationReviewStatus;
  pendingVaccines?: readonly string[];
}

export interface VaccinationPreventionSection {
  status: VaccinationReviewStatus;
  statusLabel: string;
  pendingVaccines: string[];
  guidance: string[];
  automaticPrescription: false;
}

export type GeriatricVaccineChecklistItem = {
  id: string;
  name: string;
  group: "ROTINA" | "SITUACOES_ESPECIAIS";
  note: string;
};

/**
 * Checklist operacional baseado no Calendário de Vacinação SBIm Idoso 2026/2027.
 * Ele registra revisão/pendência; não prescreve produto, esquema ou dose.
 * Indicações condicionais continuam dependentes de julgamento clínico individual.
 */
export const GERIATRIC_VACCINE_CHECKLIST: readonly GeriatricVaccineChecklistItem[] = [
  { id: "influenza", name: "Influenza (gripe)", group: "ROTINA", note: "Revisar anualmente." },
  { id: "pneumococica", name: "Pneumocócica conjugada VPC20", group: "ROTINA", note: "Revisar histórico pneumocócico prévio." },
  { id: "herpes_zoster", name: "Herpes-zóster recombinante", group: "ROTINA", note: "Revisar histórico e situações especiais." },
  { id: "dtpa_dt", name: "dTpa / dT (difteria, tétano e coqueluche)", group: "ROTINA", note: "Revisar esquema e reforços prévios." },
  { id: "hepatite_b", name: "Hepatite B", group: "ROTINA", note: "Revisar documentação do esquema prévio." },
  { id: "febre_amarela", name: "Febre amarela", group: "ROTINA", note: "Em idosos, a indicação depende de risco epidemiológico e avaliação individual." },
  { id: "vsr", name: "VSR (vírus sincicial respiratório)", group: "ROTINA", note: "Revisar idade, comorbidades e fatores individuais de risco." },
  { id: "covid19", name: "COVID-19", group: "ROTINA", note: "Revisar recomendação vigente e histórico documentado." },
  { id: "hepatite_a", name: "Hepatite A", group: "SITUACOES_ESPECIAIS", note: "Avaliar apenas quando houver indicação clínica/epidemiológica." },
  { id: "hepatite_ab", name: "Hepatites A e B (combinada)", group: "SITUACOES_ESPECIAIS", note: "Avaliar quando ambas estiverem indicadas." },
  { id: "meningococica", name: "Meningocócica conjugada ACWY ou C", group: "SITUACOES_ESPECIAIS", note: "Avaliar risco epidemiológico, surtos ou viagens." },
  { id: "triplice_viral", name: "Tríplice viral (sarampo, caxumba e rubéola)", group: "SITUACOES_ESPECIAIS", note: "Avaliar suscetibilidade e risco epidemiológico individual." },
] as const;

const PRESCRIPTIVE_VACCINE_LABEL = /\b(?:aplicar|administrar|prescrever|tomar|receber|dose|doses|esquema|reforço)\b/i;

function normalizedTextKey(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function uniqueVaccineNames(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (!normalized) continue;
    if (PRESCRIPTIVE_VACCINE_LABEL.test(normalized)) {
      throw new Error("A pendência vacinal deve conter somente o nome da vacina, sem prescrição, dose ou esquema.");
    }
    const key = normalizedTextKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function deriveVaccinationReview(input: {
  reviewed: boolean;
  pendingVaccines?: readonly string[];
}): VaccinationReview {
  const pendingVaccines = uniqueVaccineNames(input.pendingVaccines ?? []);
  if (!input.reviewed && pendingVaccines.length === 0) return { status: "UNKNOWN" };
  if (pendingVaccines.length > 0) return { status: "PENDING", pendingVaccines };
  return { status: "UP_TO_DATE" };
}

export function normalizeVaccinationReview(input: VaccinationReview | undefined): VaccinationReview {
  if (!input) return { status: "UNKNOWN" };
  if (!["UNKNOWN", "UP_TO_DATE", "PENDING"].includes(input.status)) {
    throw new Error("Status da revisão vacinal inválido.");
  }

  const pendingVaccines = uniqueVaccineNames(input.pendingVaccines ?? []);
  if (input.status === "PENDING" && pendingVaccines.length === 0) {
    throw new Error("A revisão vacinal pendente exige ao menos uma vacina registrada.");
  }
  if (input.status !== "PENDING" && pendingVaccines.length > 0) {
    throw new Error("Vacinas pendentes só podem ser registradas com status PENDING.");
  }

  return input.status === "PENDING"
    ? { status: input.status, pendingVaccines }
    : { status: input.status };
}

export function buildVaccinationPreventionSection(
  input?: VaccinationReview,
): VaccinationPreventionSection {
  const review = normalizeVaccinationReview(input);

  if (review.status === "PENDING") {
    return {
      status: review.status,
      statusLabel: "Vacinas pendentes registradas",
      pendingVaccines: [...(review.pendingVaccines ?? [])],
      guidance: [
        "Confira as pendências registradas com a carteira de vacinação e a equipe assistencial. Os próximos passos dependem de revisão clínica individual.",
      ],
      automaticPrescription: false,
    };
  }

  if (review.status === "UP_TO_DATE") {
    return {
      status: review.status,
      statusLabel: "Sem pendências registradas nesta consulta",
      pendingVaccines: [],
      guidance: [
        "Mantenha a carteira de vacinação disponível para conferência nas próximas avaliações.",
      ],
      automaticPrescription: false,
    };
  }

  return {
    status: "UNKNOWN",
    statusLabel: "Status vacinal desconhecido",
    pendingVaccines: [],
    guidance: [
      "Leve a carteira de vacinação para revisão com a equipe assistencial. Nenhuma pendência foi presumida sem esse registro.",
    ],
    automaticPrescription: false,
  };
}
