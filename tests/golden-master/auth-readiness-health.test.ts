import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAuthRequestTopologyChecks,
  buildPublicAuthReadiness,
} from "../../src/domain/security/auth-readiness.ts";
import { isPublicRoute } from "../../src/domain/security/route-access.ts";

const completeEnv = {
  appUrl: "https://prontuario.example.test",
  betterAuthSecret: "a".repeat(32),
  googleClientId: "client.apps.googleusercontent.com",
  googleClientSecret: "opaque-google-secret",
  allowedEmails: "doctor@example.test",
  bootstrapAdminEmails: "doctor@example.test",
};

test("auth readiness reports only safe boolean checks for a canonical complete configuration", () => {
  const result = buildPublicAuthReadiness(completeEnv);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.checks, {
    appUrlCanonical: true,
    betterAuthSecretConfigured: true,
    googleClientIdConfigured: true,
    googleClientSecretConfigured: true,
    allowlistConfigured: true,
    bootstrapAdminConfigured: true,
    bootstrapAdminAllowed: true,
  });
  assert.equal(JSON.stringify(result).includes("doctor@example.test"), false);
  assert.equal(JSON.stringify(result).includes("opaque-google-secret"), false);
});

test("auth readiness fails closed for non-canonical origins and placeholder credentials", () => {
  const result = buildPublicAuthReadiness({
    ...completeEnv,
    appUrl: "https://prontuario.example.test/login",
    googleClientSecret: "change-me-placeholder",
  });
  assert.equal(result.status, "incomplete");
  assert.equal(result.checks.appUrlCanonical, false);
  assert.equal(result.checks.googleClientSecretConfigured, false);
});

test("auth readiness detects bootstrap administrator outside the allowlist without exposing email", () => {
  const result = buildPublicAuthReadiness({
    ...completeEnv,
    bootstrapAdminEmails: "admin@example.test",
  });
  assert.equal(result.status, "incomplete");
  assert.equal(result.checks.bootstrapAdminConfigured, true);
  assert.equal(result.checks.bootstrapAdminAllowed, false);
  assert.equal(JSON.stringify(result).includes("admin@example.test"), false);
});

test("auth readiness accepts canonical HTTPS topology behind a reverse proxy", () => {
  const result = buildPublicAuthReadiness(completeEnv, {
    requestUrl: "http://127.0.0.1:3000/api/health/auth",
    forwardedProto: "https",
    forwardedHost: "prontuario.example.test",
    host: "127.0.0.1:3000",
  });

  assert.equal(result.status, "ready");
  assert.equal(result.checks.externalHttps, true);
  assert.equal(result.checks.externalHostMatchesAppUrl, true);
  assert.equal(result.checks.requestTopologyAligned, true);
});

test("auth readiness detects reverse proxy protocol mismatch without exposing header values", () => {
  const result = buildPublicAuthReadiness(completeEnv, {
    requestUrl: "http://127.0.0.1:3000/api/health/auth",
    forwardedProto: "http",
    forwardedHost: "prontuario.example.test",
  });

  assert.equal(result.status, "incomplete");
  assert.equal(result.checks.externalHttps, false);
  assert.equal(result.checks.externalHostMatchesAppUrl, true);
  assert.equal(result.checks.requestTopologyAligned, false);
  assert.equal(JSON.stringify(result).includes("127.0.0.1"), false);
  assert.equal(JSON.stringify(result).includes("prontuario.example.test"), false);
});

test("auth readiness detects reverse proxy host mismatch", () => {
  assert.deepEqual(
    buildAuthRequestTopologyChecks(completeEnv.appUrl, {
      requestUrl: "https://internal.example.test/api/health/auth",
      forwardedProto: "https",
      forwardedHost: "wrong.example.test, proxy.internal",
    }),
    {
      externalHttps: true,
      externalHostMatchesAppUrl: false,
      requestTopologyAligned: false,
    },
  );
});

test("only the exact auth readiness diagnostic route is public", () => {
  assert.equal(isPublicRoute("/api/health/auth"), true);
  assert.equal(isPublicRoute("/api/health/auth/private"), false);
});
