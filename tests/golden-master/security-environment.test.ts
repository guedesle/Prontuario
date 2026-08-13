import test from "node:test";
import assert from "node:assert/strict";
import { validateProductionEnvironment } from "../../src/domain/security/environment.ts";

const safe = {
  nodeEnv: "production",
  appUrl: "https://prontuario.example.com",
  databaseUrl: "mysql://user:secret@db.internal:3306/prontuario",
  betterAuthSecret: "x".repeat(48),
  googleClientId: "client-id.apps.googleusercontent.com",
  googleClientSecret: "secure-oauth-secret",
  allowedEmails: "admin@example.com,medica@example.com",
  bootstrapAdminEmails: "admin@example.com",
};

test("configuração segura de produção é aceita", () => {
  assert.deepEqual(validateProductionEnvironment(safe), { ok: true, errors: [] });
});

test("produção rejeita HTTP, segredo curto e allowlist vazia", () => {
  const result = validateProductionEnvironment({ ...safe, appUrl: "http://example.com", betterAuthSecret: "curto", allowedEmails: "", bootstrapAdminEmails: "" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("HTTPS")));
  assert.ok(result.errors.some((e) => e.includes("32")));
  assert.ok(result.errors.some((e) => e.includes("allowlist") || e.includes("AUTH_ALLOWED_EMAILS")));
});

test("administrador bootstrap precisa pertencer à allowlist", () => {
  const result = validateProductionEnvironment({ ...safe, bootstrapAdminEmails: "outro@example.com" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("fora da allowlist")));
});
