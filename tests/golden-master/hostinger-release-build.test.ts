import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

test("Hostinger release build enforces production readiness before Next.js compilation", () => {
  const command = packageJson.scripts?.["release:hostinger:build"] ?? "";
  const expectedSteps = [
    "npm run prisma:generate",
    "npx prisma migrate deploy",
    "npm run release:clinical:prestart",
    "next build --webpack",
  ];

  let previousIndex = -1;
  for (const step of expectedSteps) {
    const index = command.indexOf(step);
    assert.ok(index > previousIndex, `release:hostinger:build deve executar ${step} na ordem segura`);
    previousIndex = index;
  }
});
