import { createHmac, timingSafeEqual } from "node:crypto";

export { CUSTOMER_COOKIE_NAME, sessionCookieOptions } from "@/lib/customer/session-edge";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  const s = process.env.SESSION_SECRET?.trim() || process.env.ORBIT_PASSKEY?.trim();
  if (!s) return null;
  return s;
}

export function createCustomerSessionToken(userId: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + MAX_AGE_MS;
  const payload = `${userId}.${expiresAt}`;
  const sig = createHmac("sha256", secret).update(`customer:${payload}`).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyCustomerSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const payload = `${userId}.${expiresRaw}`;
  const expected = createHmac("sha256", secret).update(`customer:${payload}`).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return userId;
}