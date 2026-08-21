import { parseEmailSet } from "./auth-policy.ts";
import {
  isCanonicalProductionAppUrl,
  isGoogleOAuthClientId,
  isNonPlaceholderConfigValue,
} from "./environment.ts";

export interface AuthReadinessEnvironment {
  appUrl?: string;
  betterAuthSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  allowedEmails?: string;
  bootstrapAdminEmails?: string;
}

export interface AuthRequestTopology {
  requestUrl: string;
  forwardedProto?: string | null;
  forwardedHost?: string | null;
  host?: string | null;
}

export interface PublicAuthReadiness {
  status: "ready" | "incomplete";
  checks: {
    appUrlCanonical: boolean;
    betterAuthSecretConfigured: boolean;
    googleClientIdConfigured: boolean;
    googleClientSecretConfigured: boolean;
    allowlistConfigured: boolean;
    bootstrapAdminConfigured: boolean;
    bootstrapAdminAllowed: boolean;
    externalHttps?: boolean;
    externalHostMatchesAppUrl?: boolean;
    requestTopologyAligned?: boolean;
  };
}

function firstForwardedValue(value?: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

export function buildAuthRequestTopologyChecks(
  appUrl: string | undefined,
  topology: AuthRequestTopology,
) {
  let expected: URL;
  let request: URL;
  try {
    expected = new URL(appUrl ?? "");
    request = new URL(topology.requestUrl);
  } catch {
    return {
      externalHttps: false,
      externalHostMatchesAppUrl: false,
      requestTopologyAligned: false,
    };
  }

  const forwardedProto = firstForwardedValue(topology.forwardedProto)?.toLowerCase();
  const forwardedHost = firstForwardedValue(topology.forwardedHost)?.toLowerCase();
  const directHost = firstForwardedValue(topology.host)?.toLowerCase();
  const expectedHost = expected.host.toLowerCase();

  const externalProto = forwardedProto ?? request.protocol.replace(":", "").toLowerCase();
  const externalHost = forwardedHost ?? directHost ?? request.host.toLowerCase();

  const externalHttps = externalProto === "https";
  const externalHostMatchesAppUrl = externalHost === expectedHost;

  return {
    externalHttps,
    externalHostMatchesAppUrl,
    requestTopologyAligned: externalHttps && externalHostMatchesAppUrl,
  };
}

export function buildPublicAuthReadiness(
  env: AuthReadinessEnvironment,
  topology?: AuthRequestTopology,
): PublicAuthReadiness {
  const allowed = parseEmailSet(env.allowedEmails);
  const bootstrap = parseEmailSet(env.bootstrapAdminEmails);
  const bootstrapAdminAllowed = bootstrap.size > 0 && [...bootstrap].every((email) => allowed.has(email));

  const checks: PublicAuthReadiness["checks"] = {
    appUrlCanonical: isCanonicalProductionAppUrl(env.appUrl),
    betterAuthSecretConfigured:
      isNonPlaceholderConfigValue(env.betterAuthSecret) && (env.betterAuthSecret?.length ?? 0) >= 32,
    googleClientIdConfigured: isGoogleOAuthClientId(env.googleClientId),
    googleClientSecretConfigured: isNonPlaceholderConfigValue(env.googleClientSecret),
    allowlistConfigured: allowed.size > 0,
    bootstrapAdminConfigured: bootstrap.size > 0,
    bootstrapAdminAllowed,
  };

  if (topology) {
    Object.assign(checks, buildAuthRequestTopologyChecks(env.appUrl, topology));
  }

  return {
    status: Object.values(checks).every(Boolean) ? "ready" : "incomplete",
    checks,
  };
}
