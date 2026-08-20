import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";

export async function GET(request: Request) {
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/login?error=google",
      },
      headers: request.headers,
    });

    if (!result.url) {
      return NextResponse.redirect(new URL("/login?error=oauth_start", request.url), 303);
    }

    return NextResponse.redirect(result.url, 303);
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_start", request.url), 303);
  }
}
