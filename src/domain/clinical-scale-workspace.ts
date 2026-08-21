export const CLINICAL_SCALE_DOMAIN_ORDER = [
  "Cognição",
  "Funcionalidade",
  "Capacidade psicológica e humor",
  "Locomoção e desempenho físico",
  "Fragilidade",
  "Vitalidade e nutrição",
  "Medicamentos e risco de quedas",
  "Família",
  "Rede e suporte social",
  "Sobrecarga do cuidador",
  "Sintomas",
  "Oncogeriatria",
  "Prognóstico e cuidados paliativos",
] as const;

export type ClinicalScaleDomain = (typeof CLINICAL_SCALE_DOMAIN_ORDER)[number];
export type ClinicalScaleSource = "core" | "complementary" | "oncogeriatric";

export interface ClinicalScaleOptionInput {
  source: ClinicalScaleSource;
  code: string;
  name: string;
  dimension?: string | null;
  appliedInCurrentConsultation?: boolean;
}

export interface ClinicalScaleOption extends ClinicalScaleOptionInput {
  key: string;
  domain: ClinicalScaleDomain;
}

const DIMENSION_DOMAIN: Record<string, ClinicalScaleDomain> = {
  cognicao: "Cognição",
  funcionalidade: "Funcionalidade",
  humor: "Capacidade psicológica e humor",
  mobilidade: "Locomoção e desempenho físico",
  fragilidade: "Fragilidade",
  nutricao: "Vitalidade e nutrição",
  medicamentos: "Medicamentos e risco de quedas",
  familia: "Família",
  suporte_social: "Rede e suporte social",
  "suporte-social": "Rede e suporte social",
  sobrecarga_cuidador: "Sobrecarga do cuidador",
  sintomas: "Sintomas",
  oncogeriatria: "Oncogeriatria",
  prognostico: "Prognóstico e cuidados paliativos",
};

const CODE_DOMAIN: Record<string, ClinicalScaleDomain> = {
  apgar_familiar: "Família",
  family_apgar_br_elderly: "Família",
  mos_sss_br_19: "Rede e suporte social",
  zarit_reduzida: "Sobrecarga do cuidador",
  zarit_paliativo_7_ms2013: "Sobrecarga do cuidador",
  zarit_br_22: "Sobrecarga do cuidador",
  mna_sf: "Vitalidade e nutrição",
  pps: "Prognóstico e cuidados paliativos",
  kps: "Prognóstico e cuidados paliativos",
  lace: "Prognóstico e cuidados paliativos",
  charlson: "Prognóstico e cuidados paliativos",
  esas: "Sintomas",
  ecog: "Oncogeriatria",
  crash_mna_sf: "Oncogeriatria",
  g8: "Oncogeriatria",
};

const HIDDEN_DETAILED_COGNITIVE = new Set(["meem_freitas", "moca_br_freitas"]);

function normalizeDimension(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/[\s-]+/g, "_");
}

export function clinicalScaleDomain(code: string, dimension?: string | null): ClinicalScaleDomain {
  const override = CODE_DOMAIN[code];
  if (override) return override;
  const normalized = normalizeDimension(dimension);
  return DIMENSION_DOMAIN[normalized]
    ?? DIMENSION_DOMAIN[normalized.replaceAll("_", "-")]
    ?? "Funcionalidade";
}

export function isScaleExposedInUnifiedWorkspace(input: Pick<ClinicalScaleOptionInput, "source" | "code">): boolean {
  if (input.source === "core" && HIDDEN_DETAILED_COGNITIVE.has(input.code)) return false;
  return true;
}

function sourcePriority(input: ClinicalScaleOptionInput): number {
  if ((input.code === "meem" || input.code === "moca") && input.source === "complementary") return 100;
  if (input.source === "core") return 30;
  if (input.source === "complementary") return 20;
  return 10;
}

export function buildClinicalScaleOptions(inputs: readonly ClinicalScaleOptionInput[]): ClinicalScaleOption[] {
  const byCode = new Map<string, ClinicalScaleOptionInput>();

  for (const input of inputs) {
    if (!isScaleExposedInUnifiedWorkspace(input)) continue;
    const previous = byCode.get(input.code);
    if (!previous || sourcePriority(input) > sourcePriority(previous)) byCode.set(input.code, input);
  }

  const order = new Map(CLİNICAL_SCALE_DOMAIN_ORDER_COMPAT().map((domain, index) => [domain, index]));
  return [...byCode.values()]
    .map((input) => ({
      ...input,
      key: `${input.source}:${input.code}`,
      domain: clinicalScaleDomain(input.code, input.dimension),
    }))
    .sort((left, right) =>
      (order.get(left.domain) ?? 999) - (order.get(right.domain) ?? 999)
      || left.name.localeCompare(right.name, "pt-BR"),
    );
}

// Kept as a function so callers/tests cannot mutate the canonical readonly tuple.
export function CLİNICAL_SCALE_DOMAIN_ORDER_COMPAT(): readonly ClinicalScaleDomain[] {
  return CLINICAL_SCALE_DOMAIN_ORDER;
}

export function groupClinicalScaleOptions(options: readonly ClinicalScaleOption[]): Array<{
  domain: ClinicalScaleDomain;
  options: ClinicalScaleOption[];
}> {
  return CLINICAL_SCALE_DOMAIN_ORDER.map((domain) => ({
    domain,
    options: options.filter((option) => option.domain === domain),
  })).filter((group) => group.options.length > 0);
}
