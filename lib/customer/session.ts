import { createHmac, timingSafeEqual } from "node:crypto";

export { CUSTOMER_COOKIE_NAME, sessionCookieOptions } from "@/lib/customer/session-edge";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  const s = process.env.SESSION_SECRET?.trim() || process.env.ORBIT_PASSKEY?.trim();
  if (!s) return null;
  return s;
}

export function createCustomerSessionToken(userId: string, sessionVersion = 0): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + MAX_AGE_MS;
  const version = Number.isFinite(sessionVersion) && sessionVersion > 0 ? Math.floor(sessionVersion) : 0;
  const payload = `${userId}.${expiresAt}.${version}`;
  const sig = createHmac("sha256", secret).update(`customer:${payload}`).digest("hex");
  return `${payload}.${sig}`;
}

export function parseCustomerSessionToken(
  token: string | undefined | null,
): { userId: string; version: number } | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  let userId = "";
  let expiresRaw = "";
  let signature = "";
  let version = 0;
  let payload = "";
  if (parts.length === 3) {
    [userId, expiresRaw, signature] = parts;
    payload = `${userId}.${expiresRaw}`;
  } else if (parts.length === 4) {
    const versionRaw = parts[2];
    [userId, expiresRaw, , signature] = parts;
    version = Number(versionRaw);
    if (!Number.isFinite(version) || version < 0) return null;
    payload = `${userId}.${expiresRaw}.${versionRaw}`;
  } else {
    return null;
  }
  const expiresAt = Number(expiresRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const expected = createHmac("sha256", secret).update(`customer:${payload}`).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId, version };
}

export function verifyCustomerSessionToken(token: string | undefined | null): string | null {
  return parseCustomerSessionToken(token)?.userId ?? null;
}