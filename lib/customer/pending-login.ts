import { createHmac, timingSafeEqual } from "node:crypto";

export const PENDING_LOGIN_COOKIE = "trustify_2fa";
const MAX_AGE_MS = 5 * 60 * 1000;

export type PendingLogin = {
  userId: string;
  remember: boolean;
  method: "password" | "google";
};

function secret() {
  return process.env.SESSION_SECRET?.trim() || process.env.ORBIT_PASSKEY?.trim() || "";
}

export function createPendingLoginToken(input: PendingLogin): string | null {
  const key = secret();
  if (!key) return null;
  const expiresAt = Date.now() + MAX_AGE_MS;
  const payload = `${input.userId}.${expiresAt}.${input.remember ? 1 : 0}.${input.method}`;
  const sig = createHmac("sha256", key).update(`pending2fa:${payload}`).digest("hex");
  return `${payload}.${sig}`;
}

export function readPendingLoginToken(token: string | undefined | null): PendingLogin | null {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [userId, expiresRaw, rememberRaw, method, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  if (method !== "password" && method !== "google") return null;
  const payload = `${userId}.${expiresRaw}.${rememberRaw}.${method}`;
  const expected = createHmac("sha256", key).update(`pending2fa:${payload}`).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId, remember: rememberRaw === "1", method };
}

export function pendingCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(MAX_AGE_MS / 1000),
  };
}

const attempts = new Map<string, number[]>();

export function rateLimitTotp(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

export function resetTotpRateLimit() {
  attempts.clear();
}
