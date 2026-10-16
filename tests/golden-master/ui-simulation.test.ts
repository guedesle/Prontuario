import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUiSimulationEnvironment,
  simulationHeaders,
  simulationUpgradeHeaders,
} from "../../scripts/ui-simulation.mjs";

test("simulação de UI recusa produção", () => {
  assert.throws(
    () => buildUiSimulationEnvironment({ NODE_ENV: "production" }),
    /UI_SIMULATION_PRODUCTION_FORBIDDEN/,
  );
});

test("simulação de UI usa configuração local e banco efêmero", () => {
  const environment = buildUiSimulationEnvironment({
    UI_SIMULATION_SECRET: "s".repeat(32),
  });

  assert.equal(environment.NODE_ENV, "development");
  assert.equal(environment.APP_URL, "http://127.0.0.1:3101");
  assert.equal(environment.CI, "true");
  assert.equal(environment.E2E_AUTH_ENABLED, "1");
  assert.equal(environment.DATABASE_URL, environment.TEST_DATABASE_URL);
  assert.match(environment.DATABASE_URL, /ui-ci-simulation/);
  assert.equal(environment.UI_SIMULATION_EMAIL, "ci-e2e-ui@example.com");
  assert.equal(environment.E2E_AUTH_SECRET, "s".repeat(32));
});

test("proxy da simulação injeta somente identidade sintética", () => {
  const headers = simulationHeaders("secret");

  assert.equal(headers.get("x-prontuario-e2e-user"), "ci-e2e-ui@example.com");
  assert.equal(headers.get("x-prontuario-e2e-secret"), "secret");
  assert.equal(headers.get("x-prontuario-ui-simulation"), "1");
});

test("túnel HMR preserva upgrade e aponta para o Next interno", () => {
  const headers = simulationUpgradeHeaders({
    host: "127.0.0.1:3101",
    connection: "Upgrade",
    upgrade: "websocket",
  }, "secret");

  assert.equal(headers.get("host"), "127.0.0.1:3100");
  assert.equal(headers.get("connection"), "Upgrade");
  assert.equal(headers.get("upgrade"), "websocket");
  assert.equal(headers.get("x-prontuario-e2e-user"), "ci-e2e-ui@example.com");
  assert.equal(headers.get("x-prontuario-e2e-secret"), "secret");
});
