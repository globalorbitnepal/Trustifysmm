import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeGoogleCode,
  googleClientConfig,
  OAUTH_STATE_COOKIE,
  siteUrl,
  verifyGoogleIdToken,
} from "@/lib/customer/google-oauth";
import { loginOrRegisterWithGoogle } from "@/lib/customer/user-store";
import { recordLogin } from "@/lib/customer/panel-store";
import { createCustomerSessionToken, CUSTOMER_COOKIE_NAME, sessionCookieOptions } from "@/lib/customer/session";

function redirectWithError(code: string) {
  return NextResponse.redirect(`${siteUrl()}/signin?error=${encodeURIComponent(code)}`);
}

export async function GET(request: Request) {
  if (!googleClientConfig()) return redirectWithError("google_not_configured");

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) return redirectWithError(oauthError);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithError("invalid_oauth_state");
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.id_token) return redirectWithError("missing_id_token");
    const profile = await verifyGoogleIdToken(tokens.id_token);
    const result = await loginOrRegisterWithGoogle(profile);
    if (result.error) return redirectWithError("account_conflict");

    const session = createCustomerSessionToken(result.user!.id, result.user!.sessionVersion ?? 0);
    if (!session) return redirectWithError("session_unavailable");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await recordLogin(result.user!.id, "google", ip);

    const res = NextResponse.redirect(`${siteUrl()}/dashboard`);
    res.cookies.set(CUSTOMER_COOKIE_NAME, session, sessionCookieOptions(true));
    res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return redirectWithError("google_callback_failed");
  }
}