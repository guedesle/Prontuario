import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const loginSource = readFileSync("src/app/login/page.tsx", "utf8");
const routeSource = readFileSync("src/app/auth/google/route.ts", "utf8");

test("login Google usa link navegável sem depender de hidratação do React", () => {
  assert.match(loginSource, /href="\/auth\/google"/);
  assert.doesNotMatch(loginSource, /onClick=/);
  assert.doesNotMatch(loginSource, /authClient\.signIn\.social/);
});

test("rota de bootstrap OAuth preserva state cookies e redireciona para Google", () => {
  assert.match(routeSource, /auth\.api\.signInSocial/);
  assert.match(routeSource, /provider:\s*"google"/);
  assert.match(routeSource, /returnHeaders:\s*true/);
  assert.match(routeSource, /appendSetCookies\(authHeaders, redirect\.headers\)/);
  assert.match(routeSource, /NextResponse\.redirect\(result\.url, 303\)/);
});

test("falha no bootstrap retorna para login com erro visível", () => {
  assert.match(routeSource, /\/login\?error=oauth_start/);
  assert.match(loginSource, /Não foi possível iniciar a autenticação com o Google/);
});
