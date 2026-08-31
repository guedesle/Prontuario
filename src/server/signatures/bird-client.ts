import { createHash, randomBytes } from "node:crypto";

const BIRD_PRODUCTION_API = "https://api.birdid.com.br";
const BIRD_HOMOLOGATION_API = "https://apihom.birdid.com.br";
const ALLOWED_BIRD_API_BASE_URLS = new Set([BIRD_PRODUCTION_API, BIRD_HOMOLOGATION_API]);
const MAX_DOCUMENT_BYTES = 7 * 1024 * 1024;
const MAX_SIGNED_DOCUMENT_BYTES = 12 * 1024 * 1024;
const ALLOWED_POLICIES = new Set(["AD_RB", "AD_RT"]);

export type BirdConfig = {
  apiBaseUrl: string;
  cessBaseUrl: string;
  clientId: string;
  clientSecret: string;
  cloudId: string;
  redirectUri: string;
  signaturePolicy: "AD_RB" | "AD_RT";
};

type BirdEnvironment = Record<string, string | undefined>;

function required(env: BirdEnvironment, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`BIRD_NOT_CONFIGURED:${name}`);
  return value;
}

function normalizedOrigin(value: string, code: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`BIRD_CONFIGURATION_INVALID:${code}`);
  }
  if (url.protocol !== "https:") throw new Error(`BIRD_CONFIGURATION_INVALID:${code}`);
  if (url.username || url.password || url.search || url.hash) throw new Error(`BIRD_CONFIGURATION_INVALID:${code}`);
  return url.origin;
}

export function getBirdConfig(env: BirdEnvironment = process.env): BirdConfig {
  const appUrlRaw = required(env, "APP_URL").replace(/\/$/, "");
  const appUrl = new URL(appUrlRaw);
  const apiBaseUrl = (env.BIRD_API_BASE_URL?.trim().replace(/\/$/, ""))
    || (env.NODE_ENV === "production" ? BIRD_PRODUCTION_API : BIRD_HOMOLOGATION_API);
  if (!ALLOWED_BIRD_API_BASE_URLS.has(apiBaseUrl)) {
    throw new Error("BIRD_CONFIGURATION_INVALID:API_BASE_URL");
  }

  const cessBaseUrl = normalizedOrigin(required(env, "BIRD_CESS_BASE_URL").replace(/\/$/, ""), "CESS_BASE_URL");
  const clientId = required(env, "BIRD_CLIENT_ID");
  const clientSecret = required(env, "BIRD_CLIENT_SECRET");
  const cloudId = required(env, "BIRD_CLOUD_ID");
  if (!/^[A-Za-z0-9._-]{2,64}$/.test(cloudId)) throw new Error("BIRD_CONFIGURATION_INVALID:CLOUD_ID");

  const redirectUri = env.BIRD_REDIRECT_URI?.trim() || `${appUrlRaw}/api/signatures/bird/callback`;
  let redirect: URL;
  try {
    redirect = new URL(redirectUri);
  } catch {
    throw new Error("BIRD_CONFIGURATION_INVALID:REDIRECT_URI");
  }
  if (redirect.origin !== appUrl.origin || redirect.pathname !== "/api/signatures/bird/callback") {
    throw new Error("BIRD_CONFIGURATION_INVALID:REDIRECT_URI");
  }

  const policy = env.BIRD_SIGNATURE_POLICY?.trim() || "AD_RB";
  if (!ALLOWED_POLICIES.has(policy)) throw new Error("BIRD_CONFIGURATION_INVALID:SIGNATURE_POLICY");

  return {
    apiBaseUrl,
    cessBaseUrl,
    clientId,
    clientSecret,
    cloudId,
    redirectUri,
    signaturePolicy: policy as BirdConfig["signaturePolicy"],
  };
}

export function createBirdPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildBirdAuthorizationUrl(input: {
  config: BirdConfig;
  challenge: string;
  state: string;
}): string {
  const url = new URL(`${input.config.apiBaseUrl}/v0/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.config.clientId);
  url.searchParams.set("redirect_uri", input.config.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("scope", "single_signature");
  url.searchParams.set("lifetime", "300");
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", input.challenge);
  return url.toString();
}

async function parseJson(response: Response, operation: string): Promise<Record<string, unknown>> {
  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`BIRD_${operation}_INVALID_RESPONSE`);
  }
  if (!response.ok) throw new Error(`BIRD_${operation}_HTTP_${response.status}`);
  if (!payload || typeof payload !== "object") throw new Error(`BIRD_${operation}_INVALID_RESPONSE`);
  return payload as Record<string, unknown>;
}

export async function exchangeBirdAuthorizationCode(input: {
  config: BirdConfig;
  code: string;
  verifier: string;
}): Promise<string> {
  const response = await fetch(`${input.config.apiBaseUrl}/v0/oauth/token`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      code_verifier: input.verifier,
      redirect_uri: input.config.redirectUri,
      client_id: input.config.clientId,
      client_secret: input.config.clientSecret,
      code: input.code,
      grant_type: "authorization_code",
      lifetime: 300,
    }),
    cache: "no-store",
  });
  const payload = await parseJson(response, "TOKEN");
  const accessToken = payload.access_token;
  if (typeof accessToken !== "string" || !accessToken) throw new Error("BIRD_TOKEN_MISSING");
  return accessToken;
}

export function buildBirdVcSchema(cloudId: string, accessToken: string): string {
  return Buffer.from(`${cloudId}-|${accessToken}`, "utf8").toString("base64");
}

export function buildBirdCessSignatureRequest(input: {
  documentId: string;
  pdf: Buffer;
  policy: "AD_RB" | "AD_RT";
}) {
  return {
    certificate_alias: "",
    type: "PAdEs",
    policy: input.policy,
    hash_algorithm: "SHA256",
    auto_fix_document: true,
    mode: "sync",
    signature_settings: [{
      id: "default",
      reason: "Assinatura digital de documento clínico revisado",
      visible_signature: false,
    }],
    documents_source: "DATA_URL",
    documents: [{
      id: input.documentId,
      data: `data:application/pdf;base64,${input.pdf.toString("base64")}`,
    }],
  } as const;
}

function assertSafeResultUrl(result: string, cessBaseUrl: string): URL {
  let url: URL;
  try {
    url = new URL(result);
  } catch {
    throw new Error("BIRD_SIGNED_DOCUMENT_URL_INVALID");
  }
  if (url.protocol !== "https:" || url.origin !== new URL(cessBaseUrl).origin) {
    throw new Error("BIRD_SIGNED_DOCUMENT_URL_INVALID");
  }
  return url;
}

function assertSignedPdf(candidate: Buffer, unsignedPdf: Buffer): Buffer {
  if (candidate.length <= unsignedPdf.length || candidate.equals(unsignedPdf)) {
    throw new Error("BIRD_SIGNED_DOCUMENT_INVALID");
  }
  if (candidate.length > MAX_SIGNED_DOCUMENT_BYTES) throw new Error("BIRD_SIGNED_DOCUMENT_TOO_LARGE");
  const header = candidate.subarray(0, Math.min(candidate.length, 1024));
  const eof = candidate.subarray(Math.max(0, candidate.length - 2048));
  if (header.indexOf(Buffer.from("%PDF-", "ascii")) < 0
    || eof.indexOf(Buffer.from("%%EOF", "ascii")) < 0
    || candidate.indexOf(Buffer.from("/ByteRange", "ascii")) < 0
    || candidate.indexOf(Buffer.from("/Contents", "ascii")) < 0) {
    throw new Error("BIRD_SIGNED_DOCUMENT_INVALID");
  }
  return candidate;
}

export async function signPdfWithBird(input: {
  config: BirdConfig;
  accessToken: string;
  documentId: string;
  pdf: Buffer;
}): Promise<{ signedPdf: Buffer; certificateAlias?: string }> {
  if (input.pdf.length > MAX_DOCUMENT_BYTES) throw new Error("BIRD_DOCUMENT_TOO_LARGE");
  const authorization = `VCSchema ${buildBirdVcSchema(input.config.cloudId, input.accessToken)}`;
  const response = await fetch(`${input.config.cessBaseUrl}/signature-service`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization,
    },
    body: JSON.stringify(buildBirdCessSignatureRequest({
      documentId: input.documentId,
      pdf: input.pdf,
      policy: input.config.signaturePolicy,
    })),
    cache: "no-store",
  });
  const payload = await parseJson(response, "CESS_SIGNATURE");
  const documents = payload.documents;
  if (!Array.isArray(documents) || !documents[0] || typeof documents[0] !== "object") {
    throw new Error("BIRD_SIGNED_DOCUMENT_MISSING");
  }
  const document = documents[0] as Record<string, unknown>;
  if (document.status !== "SIGNED" || typeof document.result !== "string") {
    throw new Error("BIRD_SIGNED_DOCUMENT_MISSING");
  }
  const resultUrl = assertSafeResultUrl(document.result, input.config.cessBaseUrl);
  const pdfResponse = await fetch(resultUrl, {
    method: "GET",
    headers: { accept: "application/pdf", authorization },
    cache: "no-store",
  });
  if (!pdfResponse.ok) throw new Error(`BIRD_DOCUMENT_DOWNLOAD_HTTP_${pdfResponse.status}`);
  const signedPdf = assertSignedPdf(Buffer.from(await pdfResponse.arrayBuffer()), input.pdf);
  const certificateAlias = typeof payload.certificate_alias === "string" ? payload.certificate_alias : undefined;
  return { signedPdf, certificateAlias };
}

export const birdEndpoints = Object.freeze({
  homologation: BIRD_HOMOLOGATION_API,
  production: BIRD_PRODUCTION_API,
});
