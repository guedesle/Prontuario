export interface UiSimulationEnvironment {
  NODE_ENV: "development";
  APP_URL: string;
  CI: "true";
  E2E_AUTH_ENABLED: "1";
  E2E_AUTH_SECRET: string;
  DATABASE_URL: string;
  TEST_DATABASE_URL: string;
  UI_SIMULATION_EMAIL: "ci-e2e-ui@example.com";
  NEXT_TELEMETRY_DISABLED: "1";
}

export function buildUiSimulationEnvironment(input?: Record<string, string | undefined>): UiSimulationEnvironment;
export function simulationHeaders(secret: string, source?: HeadersInit): Headers;
export function simulationUpgradeHeaders(source: Record<string, string | string[] | undefined>, secret: string): Map<string, string>;
