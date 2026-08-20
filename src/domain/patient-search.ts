import { normalizePersonName } from "./patient-identity.ts";

export const PATIENT_SEARCH_MIN_LENGTH = 2;
export const PATIENT_SEARCH_LIMIT = 8;

export class PatientSearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatientSearchValidationError";
  }
}

export interface PatientSelectionCandidate {
  id: string;
  fullName: string;
  birthDate?: Date | string | null;
  needsIdentityReview: boolean;
}

export interface PatientSelectionResult {
  id: string;
  fullName: string;
  birthDate: string | null;
  needsIdentityReview: boolean;
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

export function toPatientSelectionResult(
  patient: PatientSelectionCandidate,
): PatientSelectionResult {
  let birthDate: string | null = null;
  if (patient.birthDate) {
    const parsed = patient.birthDate instanceof Date
      ? patient.birthDate
      : new Date(patient.birthDate);
    if (!Number.isNaN(parsed.getTime())) birthDate = parsed.toISOString().slice(0, 10);
  }

  return {
    id: patient.id,
    fullName: patient.fullName.trim().replace(/\s+/g, " "),
    birthDate,
    needsIdentityReview: patient.needsIdentityReview,
  };
}
