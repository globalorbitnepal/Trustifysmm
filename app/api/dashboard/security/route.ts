import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonWithSession } from "@/lib/customer/auth-response";
import { CUSTOMER_COOKIE_NAME, sessionAgeMs, sessionCookieOptions, createCustomerSessionToken } from "@/lib/customer/session";
import { addNotification, listLogins, recordAudit } from "@/lib/customer/panel-store";
import { requireCustomer } from "@/lib/customer/guard";
import { rateLimitTotp } from "@/lib/customer/pending-login";
import {
  beginTotpEnrollment,
  clearTotp,
  confirmTotpEnrollment,
  consumeRecoveryCode,
  regenerateRecoveryCodes,
  totpStatus,
  verifyTotpForUser,
} from "@/lib/customer/totp-store";
import { bumpSessionVersion, changeCustomerPassword, setCustomerPassword, toPublicUser } from "@/lib/customer/user-store";
import { verifyPassword } from "@/lib/customer/password";

export const dynamic = "force-dynamic";

const RECENT_MS = 15 * 60 * 1000;

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
    recoveryCode?: string;
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
    return NextResponse.json({ secret: started.secret, account: started.account, mode: started.mode });
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
      body: "Google Authenticator is now required on every new sign-in. Keep the recovery codes somewhere private.",
      href: "/dashboard/security",
    });
    if (!next) return NextResponse.json({ recoveryCodes: confirmed.recoveryCodes, activatedAt: confirmed.activatedAt });
    next.balance = user.balance;
    return sessionJson(next, { recoveryCodes: confirmed.recoveryCodes, activatedAt: confirmed.activatedAt, twoFactor: { enabled: true, activatedAt: confirmed.activatedAt } });
  }
  if (body.action === "totp-disable") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    if (!rateLimitTotp(`disable:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const proof = await proofOfAuthenticator(user.id, body.code || "", body.recoveryCode || "");
    if (proof) return NextResponse.json({ error: proof }, { status: 401 });
    await clearTotp(user.id);
    const next = await bumpSessionVersion(user.id);
    await recordAudit(user.id, "totp_disabled");
    await addNotification({
      userId: user.id,
      type: "security",
      title: "Authenticator disabled",
      body: "Google Authenticator was turned off. New sign-ins no longer ask for a code.",
      href: "/dashboard/security",
    });
    if (!next) return NextResponse.json({ ok: true, twoFactor: { enabled: false, activatedAt: null } });
    next.balance = user.balance;
    return sessionJson(next, { twoFactor: { enabled: false, activatedAt: null } });
  }
  if (body.action === "totp-regenerate") {
    const recent = await recentAuth(user.passwordHash, body.currentPassword || "");
    if (recent) return NextResponse.json({ error: recent }, { status: 401 });
    if (!rateLimitTotp(`regen:${user.id}`)) return NextResponse.json({ error: "Too many codes. Wait a few minutes." }, { status: 429 });
    const checked = await verifyTotpForUser(user.id, body.code || "");
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 401 });
    const next = await regenerateRecoveryCodes(user.id);
    if ("error" in next) return NextResponse.json({ error: next.error }, { status: 400 });
    await recordAudit(user.id, "totp_recovery_regenerated");
    await addNotification({
      userId: user.id,
      type: "security",
      title: "Recovery codes replaced",
      body: "New authenticator recovery codes were created. The previous codes no longer work.",
      href: "/dashboard/security",
    });
    return NextResponse.json({ recoveryCodes: next.recoveryCodes });
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
    return null;
  }
  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value;
  const age = sessionAgeMs(token);
  if (age == null || age > RECENT_MS) {
    return "Sign out, sign in with Google, then open Security Settings within 15 minutes.";
  }
  return null;
}

async function proofOfAuthenticator(userId: string, code: string, recoveryCode: string) {
  if (recoveryCode.trim()) {
    const used = await consumeRecoveryCode(userId, recoveryCode);
    return "error" in used ? used.error : null;
  }
  const checked = await verifyTotpForUser(userId, code);
  return "error" in checked ? checked.error : null;
}
