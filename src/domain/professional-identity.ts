export interface ProfessionalIdentity {
  displayName: string;
  roleLabel: string;
  registrationLine?: string;
  logoPath?: string;
  logoAlt?: string;
  personalizedBrand: boolean;
}

export interface ProfessionalIdentitySource {
  name?: string | null;
  email: string;
  brandOwnerEmail?: string | null;
}

const NATALIA_IDENTITY: ProfessionalIdentity = {
  displayName: "Dra. Natalia Mendes",
  roleLabel: "Médica Geriatra",
  registrationLine: "CRM-BA 27416 · RQE 24673",
  logoPath: "/brand/natalia-mendes-logo.svg",
  logoAlt: "Natalia Mendes — Médica Geriatra",
  personalizedBrand: true,
};

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildProfessionalIdentity(source: ProfessionalIdentitySource): ProfessionalIdentity {
  const ownerEmail = normalizeEmail(source.brandOwnerEmail);
  const userEmail = normalizeEmail(source.email);
  const ownerByConfiguredEmail = Boolean(ownerEmail) && ownerEmail === userEmail;
  const ownerByNameFallback = !ownerEmail && normalizeName(source.name) === "natalia mendes";

  if (ownerByConfiguredEmail || ownerByNameFallback) return { ...NATALIA_IDENTITY };

  return {
    displayName: source.name?.trim() || "Profissional autenticado",
    roleLabel: "Profissional responsável",
    personalizedBrand: false,
  };
}
