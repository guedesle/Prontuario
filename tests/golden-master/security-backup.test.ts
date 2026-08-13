import test from "node:test";
import assert from "node:assert/strict";
import { assertRestoreConfirmation, decodeBackupKey } from "../../src/domain/security/backup-policy.ts";

test("backup exige chave AES-256 de 32 bytes", () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  assert.equal(decodeBackupKey(key).length, 32);
  assert.throws(() => decodeBackupKey(Buffer.alloc(16).toString("base64")));
});

test("restore exige confirmação explícita e dupla confirmação em produção", () => {
  assert.doesNotThrow(() => assertRestoreConfirmation({ nodeEnv: "development", confirmation: "RESTORE" }));
  assert.throws(() => assertRestoreConfirmation({ nodeEnv: "production", confirmation: "RESTORE" }));
  assert.doesNotThrow(() => assertRestoreConfirmation({ nodeEnv: "production", confirmation: "RESTORE", productionConfirmation: "RESTORE_PRODUCTION" }));
});
