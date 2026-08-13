import test from "node:test";
import assert from "node:assert/strict";
import {
  assertActiveAllowedUser,
  assertCanChangeAdminState,
  assertPermission,
  assertRecentAuthentication,
  isEmailAllowed,
  parseEmailSet,
  roleForFirstLogin,
} from "../../src/domain/security/auth-policy.ts";

const allowed = parseEmailSet("medica@example.com; admin@example.com");

test("allowlist normaliza email e falha fechada fora da lista", () => {
  assert.equal(isEmailAllowed(" MEDICA@example.com ", allowed), true);
  assert.equal(isEmailAllowed("intruso@example.com", allowed), false);
  assert.throws(() => assertActiveAllowedUser({ user: { id: "u", email: "intruso@example.com", role: "PHYSICIAN", active: true }, allowedEmails: allowed }));
});

test("bootstrap define ADMIN somente para email explicitamente configurado", () => {
  const bootstrap = parseEmailSet("admin@example.com");
  assert.equal(roleForFirstLogin({ email: "admin@example.com", bootstrapAdmins: bootstrap }), "ADMIN");
  assert.equal(roleForFirstLogin({ email: "medica@example.com", bootstrapAdmins: bootstrap }), "PHYSICIAN");
});

test("RBAC impede usuário somente leitura de alterar prontuário", () => {
  assert.doesNotThrow(() => assertPermission("READ_ONLY", "patient.read"));
  assert.throws(() => assertPermission("READ_ONLY", "consultation.write"));
  assert.doesNotThrow(() => assertPermission("PHYSICIAN", "document.generate"));
  assert.throws(() => assertPermission("PHYSICIAN", "user.manage"));
});

test("ações administrativas exigem autenticação recente", () => {
  const now = new Date("2026-08-13T12:00:00Z");
  assert.doesNotThrow(() => assertRecentAuthentication({ authenticatedAt: new Date("2026-08-13T11:55:00Z"), now, maxAgeSeconds: 600 }));
  assert.throws(() => assertRecentAuthentication({ authenticatedAt: new Date("2026-08-13T11:40:00Z"), now, maxAgeSeconds: 600 }));
});

test("último administrador ativo não pode ser removido", () => {
  assert.throws(() => assertCanChangeAdminState({
    targetUserId: "a1", targetRole: "ADMIN", targetActive: true,
    nextRole: "PHYSICIAN", activeAdminIds: ["a1"],
  }));
  assert.doesNotThrow(() => assertCanChangeAdminState({
    targetUserId: "a1", targetRole: "ADMIN", targetActive: true,
    nextActive: false, activeAdminIds: ["a1", "a2"],
  }));
});
