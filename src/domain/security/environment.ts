import { parseEmailSet } from "./auth-policy.ts";

export interface ProductionEnvironment {
  nodeEnv?: string;
  appUrl?: string;
  databaseUrl?: string;
  betterAuthSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  allowedEmails?: string;
  bootstrapAdminEmails?: string;
}

export interface EnvironmentValidation {
  ok: boolean;
  errors: string[];
}

function nonPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  return !/(trocar|change|example|your-|placeholder)/i.test(value);
}

export function validateProductionEnvironment(env: ProductionEnvironment): EnvironmentValidation {
  const errors: string[] = [];
  const production = env.nodeEnv === "production";

  if (!env.appUrl) {
    errors.push("APP_URL é obrigatória.");
  } else {
    try {
      const url = new URL(env.appUrl);
      if (production && url.protocol !== "https:") errors.push("APP_URL deve usar HTTPS em produção.");
    } catch {
      errors.push("APP_URL inválida.");
    }
  }

  if (!env.databaseUrl?.startsWith("mysql://")) {
    errors.push("DATABASE_URL deve usar mysql://.");
  }

  if (!nonPlaceholder(env.betterAuthSecret) || (env.betterAuthSecret?.length ?? 0) < 32) {
    errors.push("BETTER_AUTH_SECRET deve ser não previsível e ter pelo menos 32 caracteres.");
  }
  if (!nonPlaceholder(env.googleClientId)) errors.push("GOOGLE_CLIENT_ID é obrigatório.");
  if (!nonPlaceholder(env.googleClientSecret)) errors.push("GOOGLE_CLIENT_SECRET é obrigatório.");

  const allowed = parseEmailSet(env.allowedEmails);
  const bootstrap = parseEmailSet(env.bootstrapAdminEmails);
  if (allowed.size === 0) errors.push("AUTH_ALLOWED_EMAILS não pode ficar vazia.");
  if (bootstrap.size === 0) errors.push("AUTH_BOOTSTRAP_ADMIN_EMAILS deve conter ao menos um administrador inicial.");
  for (const email of bootstrap) {
    if (!allowed.has(email)) errors.push(`Administrador bootstrap fora da allowlist: ${email}.`);
  }

  return { ok: errors.length === 0, errors };
}

export function assertProductionEnvironment(env: ProductionEnvironment): void {
  const result = validateProductionEnvironment(env);
  if (!result.ok) throw new Error(`Configuração de produção insegura:\n- ${result.errors.join("\n- ")}`);
}
