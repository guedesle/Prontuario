import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { isPublicRoute, routeAccessFor } from "../../src/domain/security/route-access.ts";
import { createRequestGuard } from "../../src/server/auth/request-guard.ts";

test("handler canônico do Better Auth e diagnóstico exato de assets permanecem públicos", async () => {
  let validationCalls = 0;
  const guard = createRequestGuard(async () => {
    validationCalls += 1;
    return false;
  });

  for (const pathname of ["/api/auth/sign-in/social", "/api/auth/callback/google", "/api/health/assets"]) {
    assert.equal(isPublicRoute(pathname), true);
    assert.equal(routeAccessFor({ pathname, authenticated: false }), "public");
    const response = await guard(new NextRequest(`https://prontuario.test${pathname}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  }

  assert.equal(validationCalls, 0);
});

test("rota customizada removida e exceção de diagnóstico não ampliam prefixos sensíveis", async () => {
  const guard = createRequestGuard(async () => false);

  assert.equal(isPublicRoute("/auth/google"), false);
  assert.equal(routeAccessFor({ pathname: "/auth/google", authenticated: false }), "redirect-login");
  const removedCustomRoute = await guard(new NextRequest("https://prontuario.test/auth/google"));
  assert.equal(removedCustomRoute.status, 307);
  assert.equal(removedCustomRoute.headers.get("location"), "https://prontuario.test/login");

  assert.equal(isPublicRoute("/api/health/assets/private"), false);
  assert.equal(routeAccessFor({ pathname: "/api/health/assets/private", authenticated: false }), "unauthorized-api");
  const healthChild = await guard(new NextRequest("https://prontuario.test/api/health/assets/private"));
  assert.equal(healthChild.status, 401);
});
