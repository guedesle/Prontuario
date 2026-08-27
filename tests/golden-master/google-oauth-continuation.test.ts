import assert from "node:assert/strict";
import test from "node:test";
import {
  renderGoogleOAuthContinuationPage,
  validateGoogleOAuthTarget,
} from "../../src/domain/google-oauth-continuation.ts";

const googleUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&state=state-123";

test("aceita destino OAuth Google HTTPS com state", () => {
  const url = validateGoogleOAuthTarget(googleUrl);
  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.searchParams.get("state"), "state-123");
});

test("rejeita destino externo que não seja Google", () => {
  assert.throws(
    () => validateGoogleOAuthTarget("https://example.test/oauth?state=state-123"),
    /Destino OAuth Google inválido/,
  );
});

test("rejeita destino Google sem state", () => {
  assert.throws(
    () => validateGoogleOAuthTarget("https://accounts.google.com/o/oauth2/v2/auth?client_id=test"),
    /sem state/,
  );
});

test("renderiza continuação navegável com fallback visível", () => {
  const html = renderGoogleOAuthContinuationPage(validateGoogleOAuthTarget(googleUrl));
  assert.match(html, /Continuar no Google/);
  assert.match(html, /data-google-oauth-continuation="true"/);
  assert.match(html, /accounts\.google\.com/);
  assert.match(html, /http-equiv="refresh"/);
});
