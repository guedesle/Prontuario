export type DocumentType = "SOAP" | "FAMILY_REPORT" | "MEDICATION_PLAN" | "AGA_REPORT";

export interface DocumentContext {
  patientId: string;
  consultationId: string;
  documentType: DocumentType;
}

export function assertSameClinicalContext(input: {
  patientId: string;
  consultationPatientId: string;
  documentPatientId: string;
}) {
  if (
    input.patientId !== input.consultationPatientId ||
    input.patientId !== input.documentPatientId
  ) {
    throw new Error("Contexto clínico inconsistente entre paciente, consulta e documento.");
  }
}
