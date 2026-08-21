import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

test("production build enforces clinical prestart before Next.js compilation", () => {
  const command = packageJson.scripts?.build ?? "";
  const expectedSteps = [
    "prisma generate",
    "prisma migrate deploy",
    "npm run release:clinical:prestart",
    "next build --webpack",
  ];

  let previousIndex = -1;
  for (const step of expectedSteps) {
    const index = command.indexOf(step);
    assert.ok(index > previousIndex, `build deve executar ${step} na ordem segura`);
    previousIndex = index;
  }
});

test("Hostinger release build delegates to the guarded production build", () => {
  assert.equal(packageJson.scripts?.["release:hostinger:build"], "npm run build");
});
