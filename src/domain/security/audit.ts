export interface AuditInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  requestId?: string;
  outcome?: "success" | "denied" | "error";
  reasonCode?: string;
}

export interface AuditRecord extends AuditInput {
  createdAt: Date;
}

const FORBIDDEN_KEYS = new Set([
  "patientName",
  "fullName",
  "subjective",
  "objective",
  "assessment",
  "plan",
  "content",
  "diagnosis",
  "medication",
]);

export function assertAuditMetadataSafe(metadata: Readonly<Record<string, unknown>>): void {
  for (const key of Object.keys(metadata)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`Metadado clínico proibido na auditoria: ${key}.`);
    }
  }
}

export function buildAuditRecord(input: AuditInput, now = new Date()): AuditRecord {
  if (!input.actorUserId || !input.action || !input.entityType || !input.entityId) {
    throw new Error("Evento de auditoria incompleto.");
  }
  return { ...input, createdAt: now };
}
