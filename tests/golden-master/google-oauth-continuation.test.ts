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

test("renderiza continuação somente por gesto do usuário e fallback de novo contexto", () => {
  const html = renderGoogleOAuthContinuationPage(validateGoogleOAuthTarget(googleUrl));
  assert.match(html, /Continuar com Google/);
  assert.match(html, /data-google-oauth-continuation="true"/);
  assert.match(html, /data-google-oauth-user-gesture="true"/);
  assert.match(html, /target="_top"/);
  assert.match(html, /accounts\.google\.com/);
  assert.match(html, /data-google-oauth-browser-restart="true"/);
  assert.match(html, /href="\/auth\/google\?fresh=1"/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /http-equiv="refresh"/i);
  assert.doesNotMatch(html, /window\.location|location\.replace|location\.assign/i);
});
