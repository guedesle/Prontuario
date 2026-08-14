export type SnapshotDocumentType = "SOAP" | "FAMILY_REPORT" | "MEDICATION_PLAN" | "AGA_REPORT";

export interface DocumentSnapshotInput<TContent = unknown> {
  patientId: string;
  consultationId: string;
  type: SnapshotDocumentType;
  content: TContent;
}

export interface ExistingDocumentSnapshot {
  patientId: string;
  consultationId: string;
  type: SnapshotDocumentType;
  version: number;
}

export interface VersionedDocumentSnapshot<TContent = unknown>
  extends DocumentSnapshotInput<TContent> {
  version: number;
}

export function assertSnapshotContext(input: {
  selectedPatientId: string;
  consultationPatientId: string;
  documentPatientId: string;
  selectedConsultationId: string;
  documentConsultationId: string;
}) {
  if (
    input.selectedPatientId !== input.consultationPatientId ||
    input.selectedPatientId !== input.documentPatientId
  ) {
    throw new Error("Paciente inconsistente entre seleção, consulta e documento.");
  }
  if (input.selectedConsultationId !== input.documentConsultationId) {
    throw new Error("Consulta inconsistente entre seleção e documento.");
  }
}

export function nextDocumentVersion(
  existing: readonly ExistingDocumentSnapshot[],
  consultationId: string,
  type: SnapshotDocumentType,
): number {
  const versions = existing
    .filter((item) => item.consultationId === consultationId && item.type === type)
    .map((item) => item.version);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

export function versionDocumentSnapshot<TContent>(input: {
  document: DocumentSnapshotInput<TContent>;
  existing: readonly ExistingDocumentSnapshot[];
}): VersionedDocumentSnapshot<TContent> {
  return {
    ...input.document,
    version: nextDocumentVersion(
      input.existing,
      input.document.consultationId,
      input.document.type,
    ),
  };
}
