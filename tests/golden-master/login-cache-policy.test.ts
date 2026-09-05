import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const nextConfigSource = readFileSync(new URL("../../next.config.mjs", import.meta.url), "utf8");

test("login impede cache compartilhado no navegador, CDN e proxy", () => {
  assert.match(nextConfigSource, /source:\s*"\/login"/);
  assert.match(nextConfigSource, /key:\s*"Cache-Control"[\s\S]*?private, no-store, no-cache, max-age=0, must-revalidate/);
  assert.match(nextConfigSource, /key:\s*"CDN-Cache-Control"[\s\S]*?value:\s*"no-store"/);
  assert.match(nextConfigSource, /key:\s*"Surrogate-Control"[\s\S]*?value:\s*"no-store"/);
});
