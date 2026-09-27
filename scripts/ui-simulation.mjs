import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { connect } from "node:net";
import path from "node:path";

const PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const NEXT_PORT = Number(process.env.UI_SIMULATION_NEXT_PORT || 3100);
const PROXY_PORT = Number(process.env.UI_SIMULATION_PORT || 3101);
const SIMULATION_EMAIL = "ci-e2e-ui@example.com";

export function buildUiSimulationEnvironment(input = process.env) {
  if (input.NODE_ENV === "production") {
    throw new Error("UI_SIMULATION_PRODUCTION_FORBIDDEN");
  }

  const secret = input.UI_SIMULATION_SECRET?.trim() || randomBytes(32).toString("hex");
  if (secret.length < 32) {
    throw new Error("UI_SIMULATION_SECRET_TOO_SHORT");
  }

  const databaseUrl = "mysql://ui-simulation:ui-simulation@127.0.0.1:3306/ui-ci-simulation";
  return {
    NODE_ENV: "development",
    APP_URL: `http://127.0.0.1:${PROXY_PORT}`,
    CI: "true",
    E2E_AUTH_ENABLED: "1",
    E2E_AUTH_SECRET: secret,
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl,
    UI_SIMULATION_EMAIL: SIMULATION_EMAIL,
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

export function simulationHeaders(secret, source = {}) {
  const headers = new Headers(source);
  headers.set("x-prontuario-e2e-user", SIMULATION_EMAIL);
  headers.set("x-prontuario-e2e-secret", secret);
  headers.set("x-prontuario-ui-simulation", "1");
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  return headers;
}

export function simulationUpgradeHeaders(source, secret) {
  const headers = new Map(Object.entries(source).map(([name, value]) => [name.toLowerCase(), String(value)]));
  headers.set("host", `127.0.0.1:${NEXT_PORT}`);
  headers.set("x-prontuario-e2e-user", SIMULATION_EMAIL);
  headers.set("x-prontuario-e2e-secret", secret);
  headers.set("x-prontuario-ui-simulation", "1");
  return headers;
}

async function requestBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function copyResponseHeaders(response, target) {
  for (const [name, value] of response.headers) {
    if (["content-encoding", "content-length", "transfer-encoding"].includes(name)) continue;
    target.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length) target.setHeader("set-cookie", cookies);
}

async function forward(request, response, secret) {
  const target = `http://127.0.0.1:${NEXT_PORT}${request.url}`;
  try {
    const result = await fetch(target, {
      method: request.method,
      headers: simulationHeaders(secret, request.headers),
      body: await requestBody(request),
      redirect: "manual",
      duplex: "half",
    });
    const body = Buffer.from(await result.arrayBuffer());
    response.statusCode = result.status;
    copyResponseHeaders(result, response);
    response.setHeader("content-length", body.length);
    response.end(body);
  } catch (error) {
    response.statusCode = 502;
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.end(`UI simulation upstream unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  const simulation = buildUiSimulationEnvironment();
  const server = createServer((request, response) => {
    void forward(request, response, simulation.E2E_AUTH_SECRET);
  });
  server.on("upgrade", (request, socket, head) => {
    const upstream = connect(NEXT_PORT, "127.0.0.1");
    const fail = () => {
      socket.destroy();
      upstream.destroy();
    };
    upstream.once("error", fail);
    socket.once("error", fail);
    upstream.once("connect", () => {
      const headers = simulationUpgradeHeaders(request.headers, simulation.E2E_AUTH_SECRET);
      const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
      for (const [name, value] of headers) lines.push(`${name}: ${value}`);
      upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
  });
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const next = spawn(npm, ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(NEXT_PORT)], {
    cwd: path.dirname(PROJECT_ROOT),
    env: { ...process.env, ...simulation },
    stdio: "inherit",
    shell: process.platform === "win32",
    windowsHide: true,
  });

  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    server.close();
    next.kill();
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
  next.once("exit", (code) => {
    if (!closing) {
      server.close();
      process.exitCode = code ?? 1;
    }
  });

  server.listen(PROXY_PORT, "127.0.0.1", () => {
    console.log(`UI simulation: http://127.0.0.1:${PROXY_PORT}/demo`);
    console.log(`UI simulation dietary: http://127.0.0.1:${PROXY_PORT}/visual-dietary`);
    console.log("Only synthetic CI identity headers are injected; production mode is refused.");
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
