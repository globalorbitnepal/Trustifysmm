import { NextResponse } from "next/server";
import { createOAuthState, googleAuthUrl, googleClientConfig, OAUTH_STATE_COOKIE } from "@/lib/customer/google-oauth";

export async function GET(request: Request) {
  if (!googleClientConfig()) {
    return NextResponse.json({ error: "Google Sign-In is not configured." }, { status: 503 });
  }
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";
  const state = `${createOAuthState()}.${mode}`;
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}