import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonWithSession } from "@/lib/customer/auth-response";
import { recordLogin } from "@/lib/customer/panel-store";
import {
  PENDING_LOGIN_COOKIE,
  pendingCookieOptions,
  rateLimitTotp,
  readPendingLoginToken,
} from "@/lib/customer/pending-login";
import { verifyTotpForUser } from "@/lib/customer/totp-store";
import { getUserById } from "@/lib/customer/user-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const pending = readPendingLoginToken((await cookies()).get(PENDING_LOGIN_COOKIE)?.value);
  if (!pending) return NextResponse.json({ error: "Sign-in expired. Enter your email and password again." }, { status: 401 });

  let body: { code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimitTotp(`login:${pending.userId}`) || !rateLimitTotp(`login-ip:${ip}`)) {
    const res = NextResponse.json({ error: "Too many codes. Sign in again in a few minutes." }, { status: 429 });
    res.cookies.set(PENDING_LOGIN_COOKIE, "", { ...pendingCookieOptions(), maxAge: 0 });
    return res;
  }

  const user = await getUserById(pending.userId);
  if (!user || user.suspended || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "This account cannot sign in." }, { status: 401 });
  }

  const code = body.code?.trim() || "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from Google Authenticator." }, { status: 400 });
  }
  const checked = await verifyTotpForUser(user.id, code);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 401 });

  await recordLogin(user.id, pending.method, ip);
  const res = jsonWithSession(user, pending.remember);
  res.cookies.set(PENDING_LOGIN_COOKIE, "", { ...pendingCookieOptions(), maxAge: 0 });
  return res;
}
