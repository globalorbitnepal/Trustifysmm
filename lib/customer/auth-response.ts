import { NextResponse } from "next/server";
import { createCustomerSessionToken, CUSTOMER_COOKIE_NAME, sessionCookieOptions } from "@/lib/customer/session";
import type { CustomerUser } from "@/lib/customer/types";
import { toPublicUser } from "@/lib/customer/user-store";

export function jsonWithSession(user: CustomerUser, remember = true) {
  const token = createCustomerSessionToken(user.id);
  if (!token) {
    return NextResponse.json({ error: "SESSION_SECRET is not configured on the server." }, { status: 503 });
  }
  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, sessionCookieOptions(remember));
  return res;
}

export function clearSessionCookie() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}