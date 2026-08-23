import { normalizePersonName } from "./patient-identity.ts";

export const PATIENT_SEARCH_MIN_LENGTH = 2;
export const PATIENT_SEARCH_LIMIT = 8;
export const PATIENT_SEARCH_CANDIDATE_MULTIPLIER = 4;
export const PATIENT_SEARCH_FALLBACK_PAGE_SIZE = 100;

export class PatientSearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatientSearchValidationError";
  }
}

export interface PatientSelectionConsultation {
  id: string;
  status: "DRAFT" | "IN_REVIEW";
  occurredAt?: Date | string | null;
}

export interface PatientSelectionCandidate {
  id: string;
  fullName: string;
  birthDate?: Date | string | null;
  needsIdentityReview: boolean;
  activeConsultation?: PatientSelectionConsultation | null;
}

export interface PatientSelectionResult {
  id: string;
  fullName: string;
  birthDate: string | null;
  needsIdentityReview: boolean;
  activeConsultationId: string | null;
  activeConsultationStatus: PatientSelectionConsultation["status"] | null;
  activeConsultationDate: string | null;
  destinationPath: string;
}

export function normalizePatientSearchQuery(value: string): string {
  return normalizePersonName(value);
}

export function assertPatientSearchQuery(value: string): string {
  const normalized = normalizePatientSearchQuery(value);
  if (normalized.length < PATIENT_SEARCH_MIN_LENGTH) {
    throw new PatientSearchValidationError(
      `Digite pelo menos ${PATIENT_SEARCH_MIN_LENGTH} caracteres para localizar um paciente.`,
    );
  }
  return normalized;
}

export function patientSearchTerms(normalizedQuery: string): string[] {
  return normalizedQuery
    .split(" ")
    .map((term) => term.trim())
    .filter(Boolean);
}

/**
 * Validação determinística após a consulta ao banco.
 *
 * A busca não pode depender exclusivamente de `normalizedFullName`, pois esse é
 * um campo derivado e registros históricos/importados podem ter sido gravados
 * antes da normalização atual. O nome original continua sendo a fonte de
 * verdade para confirmar o match, sem alterar qualquer dado clínico.
 */
export function patientNameMatchesSearch(fullName: string, normalizedQuery: string): boolean {
  const normalizedName = normalizePersonName(fullName);
  const terms = patientSearchTerms(normalizedQuery);
  return terms.length > 0 && terms.every((term) => normalizedName.includes(term));
}

function toIsoDate(value?: Date | string | null): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function toPatientSelectionResult(
  patient: PatientSelectionCandidate,
): PatientSelectionResult {
  const activeConsultation = patient.activeConsultation ?? null;

  return {
    id: patient.id,
    fullName: patient.fullName.trim().replace(/\s+/g, " "),
    birthDate: toIsoDate(patient.birthDate),
    needsIdentityReview: patient.needsIdentityReview,
    activeConsultationId: activeConsultation?.id ?? null,
    activeConsultationStatus: activeConsultation?.status ?? null,
    activeConsultationDate: toIsoDate(activeConsultation?.occurredAt),
    destinationPath: activeConsultation
      ? `/consultations/${activeConsultation.id}`
      : `/patients/${patient.id}`,
  };
}
