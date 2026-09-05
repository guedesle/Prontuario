import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { scripts?: Record<string, string> };

test("build da Hostinger remove .next antes de compilar", () => {
  const clean = packageJson.scripts?.["clean:next"] ?? "";
  const build = packageJson.scripts?.build ?? "";

  assert.match(clean, /rmSync\('\.next'/);
  assert.match(clean, /recursive:true/);
  assert.match(clean, /force:true/);
  assert.match(build, /^npm run clean:next && /);
});
