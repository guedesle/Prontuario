export function decodeBackupKey(value: string | undefined): Uint8Array {
  if (!value) throw new Error("BACKUP_ENCRYPTION_KEY_B64 é obrigatória.");
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error("BACKUP_ENCRYPTION_KEY_B64 não é base64 válido.");
  }
  const key = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (key.length !== 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY_B64 deve decodificar exatamente 32 bytes (AES-256). ");
  }
  return key;
}

export function assertRestoreConfirmation(input: {
  nodeEnv?: string;
  confirmation?: string;
  productionConfirmation?: string;
}): void {
  if (input.confirmation !== "RESTORE") {
    throw new Error("Restauração bloqueada: defina RESTORE_CONFIRM=RESTORE.");
  }
  if (input.nodeEnv === "production" && input.productionConfirmation !== "RESTORE_PRODUCTION") {
    throw new Error("Restauração em produção exige RESTORE_PRODUCTION_CONFIRM=RESTORE_PRODUCTION.");
  }
}
