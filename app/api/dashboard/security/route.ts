import { NextResponse } from "next/server";
import { jsonWithSession } from "@/lib/customer/auth-response";
import { CUSTOMER_COOKIE_NAME, sessionCookieOptions, createCustomerSessionToken } from "@/lib/customer/session";
import { addNotification, listLogins, recordAudit } from "@/lib/customer/panel-store";
import { requireCustomer } from "@/lib/customer/guard";
import { rateLimitTotp } from "@/lib/customer/pending-login";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  deleteAuthenticator,
  enabledTotpSecret,
  pauseAuthenticator,
  resumeAuthenticator,
  totpStatus,
} from "@/lib/customer/totp-store";
import { bumpSessionVersion, changeCustomerPassword, setCustomerPassword, toPublicUser } from "@/lib/customer/user-store";
import { verifyPassword } from "@/lib/customer/password";
import { setupQr } from "@/lib/customer/totp-qr";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const twoFactor = await totpStatus(user.id);
  return NextResponse.json({
    hasPassword: Boolean(user.passwordHash),
    twoFactor,
    logins: await listLogins(user.id),
  });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: {
    action?: string;
    currentPassword?: string;
    nextPassword?: string;
    code?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "logout-others") {
    const next = await bumpSessionVersion(user.id);
    if (!next) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    await recordAudit(user.id, "logout_other_sessions");
    next.balance = user.balance;
    return jsonWithSession(next, true);
  }
  if (body.action === "set-password") {
    if (user.passwordHash) return NextResponse.json({ error: "Password already set. Use change password." }, { status: 400 });
    const result = await setCustomerPassword(user.id, body.nextPassword || "");
    if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: 400 });
    await recordAudit(user.id, "password_set");
    result.user.balance = user.balance;
    return jsonWithSession(result.user, true);
  }
  if (body.action === "password") {
    const result = await changeCustomerPassword(user.id, body.currentPassword || "", body.nextPassword || "");
    if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: 400 });
    await recordAudit(user.id, "password_changed");
    result.user.balance = user.balance;
    return jsonWithSession(result.user, true);
  }
  if (body.action === "totp-start") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    const started = await beginTotpEnrollment(user.id, user.email);
    if ("error" in started) return NextResponse.json({ error: started.error }, { status: 400 });
    await recordAudit(user.id, "totp_enrollment_started");
    const image = await setupQr(started.secret);
    return NextResponse.json({ secret: started.secret, qr: image.qr, account: started.account, mode: started.mode });
  }
  if (body.action === "totp-label") {
    const current = await enabledTotpSecret(user.id);
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: 400 });
    const image = await setupQr(current.secret);
    return NextResponse.json({ secret: current.secret, qr: image.qr, account: "TrustifySMM", mode: "Time-based" });
  }
  if (body.action === "totp-confirm") {
    if (!rateLimitTotp(`enroll:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const confirmed = await confirmTotpEnrollment(user.id, body.code || "");
    if ("error" in confirmed) return NextResponse.json({ error: confirmed.error }, { status: 400 });
    const next = await bumpSessionVersion(user.id);
    await recordAudit(user.id, "totp_enabled");
    await addNotification({
      userId: user.id,
      type: "security",
      title: "Authenticator enabled",
      body: "Google Authenticator is now required on every new sign-in.",
      href: "/dashboard/security",
    });
    const status = await totpStatus(user.id);
    if (!next) return NextResponse.json({ activatedAt: confirmed.activatedAt, twoFactor: status });
    next.balance = user.balance;
    return sessionJson(next, { activatedAt: confirmed.activatedAt, twoFactor: status });
  }
  if (body.action === "totp-resume") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    if (!rateLimitTotp(`resume:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const resumed = await resumeAuthenticator(user.id, body.code || "");
    if ("error" in resumed) return NextResponse.json({ error: resumed.error }, { status: 401 });
    await recordAudit(user.id, "totp_enabled");
    return NextResponse.json({ twoFactor: await totpStatus(user.id) });
  }
  if (body.action === "totp-disable") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    if (!rateLimitTotp(`disable:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const paused = await pauseAuthenticator(user.id, body.code || "");
    if ("error" in paused) return NextResponse.json({ error: paused.error }, { status: 401 });
    await recordAudit(user.id, "totp_disabled");
    await addNotification({
      userId: user.id,
      type: "security",
      title: "Authenticator disabled",
      body: "Google Authenticator was turned off. The TrustifySMM entry is still in the app. New sign-ins no longer ask for a code.",
      href: "/dashboard/security",
    });
    return NextResponse.json({ twoFactor: await totpStatus(user.id) });
  }
  if (body.action === "totp-delete") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    if (!rateLimitTotp(`delete:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const removed = await deleteAuthenticator(user.id, body.code || "");
    if ("error" in removed) {
      const message = removed.error ?? "That code is not valid.";
      const status = message.includes("3 times") ? 429 : 401;
      return NextResponse.json({ error: message }, { status });
    }
    const next = await bumpSessionVersion(user.id);
    await recordAudit(user.id, "totp_deleted");
    await addNotification({
      userId: user.id,
      type: "security",
      title: "Google Authenticator deleted",
      body: "TrustifySMM was removed from this account. Delete the TrustifySMM entry in the Google Authenticator app. You can set it up again later.",
      href: "/dashboard/security",
    });
    if (!next) return NextResponse.json({ twoFactor: await totpStatus(user.id) });
    next.balance = user.balance;
    return sessionJson(next, { twoFactor: await totpStatus(user.id) });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

function sessionJson(user: NonNullable<Awaited<ReturnType<typeof bumpSessionVersion>>>, extra: Record<string, unknown>) {
  const token = createCustomerSessionToken(user.id, user.sessionVersion ?? 0);
  if (!token) return NextResponse.json({ error: "SESSION_SECRET is not configured on the server." }, { status: 503 });
  const res = NextResponse.json({ user: toPublicUser(user), ...extra });
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, sessionCookieOptions(true));
  return res;
}

async function recentAuth(passwordHash: string | null, password: string) {
  if (passwordHash) {
    if (!password || !verifyPassword(password, passwordHash)) return "Enter your current password.";
  }
  /* A Google account is already signed in on this page. The 6-digit code still has to match before Authenticator turns on. */
  return null;
}

