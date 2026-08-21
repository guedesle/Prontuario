import { NextResponse } from "next/server";
import { buildPublicAuthReadiness } from "@/domain/security/auth-readiness";

export async function GET(request: Request) {
  const headers = request.headers;
  const readiness = buildPublicAuthReadiness(
    {
      appUrl: process.env.APP_URL,
      betterAuthSecret: process.env.BETTER_AUTH_SECRET,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowedEmails: process.env.AUTH_ALLOWED_EMAILS,
      bootstrapAdminEmails: process.env.AUTH_BOOTSTRAP_ADMIN_EMAILS,
    },
    {
      requestUrl: request.url,
      forwardedProto: headers.get("x-forwarded-proto"),
      forwardedHost: headers.get("x-forwarded-host"),
      host: headers.get("host"),
    },
  );

  return NextResponse.json(readiness, {
    status: readiness.status === "ready" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
