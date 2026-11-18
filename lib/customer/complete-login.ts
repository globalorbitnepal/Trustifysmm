import { NextResponse } from "next/server";
import { jsonWithSession } from "@/lib/customer/auth-response";
import { recordLogin } from "@/lib/customer/panel-store";
import {
  PENDING_LOGIN_COOKIE,
  createPendingLoginToken,
  pendingCookieOptions,
} from "@/lib/customer/pending-login";
import { CUSTOMER_COOKIE_NAME, sessionCookieOptions } from "@/lib/customer/session";
import { totpStatus } from "@/lib/customer/totp-store";
import type { CustomerUser } from "@/lib/customer/types";

export async function finishPasswordLogin(user: CustomerUser, remember: boolean, ip: string) {
  const status = await totpStatus(user.id);
  if (status.enabled) {
    const token = createPendingLoginToken({ userId: user.id, remember, method: "password" });
    if (!token) return NextResponse.json({ error: "SESSION_SECRET is not configured on the server." }, { status: 503 });
    const res = NextResponse.json({ twoFactor: true });
    res.cookies.set(PENDING_LOGIN_COOKIE, token, pendingCookieOptions());
    return res;
  }
  await recordLogin(user.id, "password", ip);
  return jsonWithSession(user, remember);
}

export async function finishGoogleLogin(user: CustomerUser, ip: string, destination: string) {
  const status = await totpStatus(user.id);
  if (status.enabled) {
    const token = createPendingLoginToken({ userId: user.id, remember: true, method: "google" });
    const res = NextResponse.redirect(`${destination}/signin?totp=1`);
    if (token) res.cookies.set(PENDING_LOGIN_COOKIE, token, pendingCookieOptions());
    res.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  }
  const { createCustomerSessionToken } = await import("@/lib/customer/session");
  const session = createCustomerSessionToken(user.id, user.sessionVersion ?? 0);
  if (!session) return NextResponse.redirect(`${destination}/signin?error=session_unavailable`);
  await recordLogin(user.id, "google", ip);
  const res = NextResponse.redirect(`${destination}/dashboard`);
  res.cookies.set(CUSTOMER_COOKIE_NAME, session, sessionCookieOptions(true));
  res.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
