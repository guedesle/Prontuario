import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { isPublicRoute, routeAccessFor } from "../../src/domain/security/route-access.ts";
import { createRequestGuard } from "../../src/server/auth/request-guard.ts";

test("OAuth server-side e diagnóstico exato de assets permanecem públicos", async () => {
  let validationCalls = 0;
  const guard = createRequestGuard(async () => {
    validationCalls += 1;
    return false;
  });

  for (const pathname of ["/auth/google", "/api/health/assets"]) {
    assert.equal(isPublicRoute(pathname), true);
    assert.equal(routeAccessFor({ pathname, authenticated: false }), "public");
    const response = await guard(new NextRequest(`https://prontuario.test${pathname}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  }

  assert.equal(validationCalls, 0);
});

test("exceções públicas não ampliam prefixos sensíveis", async () => {
  const guard = createRequestGuard(async () => false);

  assert.equal(isPublicRoute("/auth/google/admin"), false);
  assert.equal(routeAccessFor({ pathname: "/auth/google/admin", authenticated: false }), "redirect-login");
  const authChild = await guard(new NextRequest("https://prontuario.test/auth/google/admin"));
  assert.equal(authChild.status, 307);
  assert.equal(authChild.headers.get("location"), "https://prontuario.test/login");

  assert.equal(isPublicRoute("/api/health/assets/private"), false);
  assert.equal(routeAccessFor({ pathname: "/api/health/assets/private", authenticated: false }), "unauthorized-api");
  const healthChild = await guard(new NextRequest("https://prontuario.test/api/health/assets/private"));
  assert.equal(healthChild.status, 401);
});
