/** Edge-safe customer session helpers (middleware). No node:crypto. */

export const CUSTOMER_COOKIE_NAME = "trustify_session";

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function sessionCookieOptions(remember = true) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: remember ? Math.floor(MAX_AGE_MS / 1000) : 24 * 60 * 60,
  };
}

export async function verifyCustomerSessionTokenEdge(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET?.trim() || process.env.ORBIT_PASSKEY?.trim();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const payload = `${userId}.${expiresRaw}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`customer:${payload}`));
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0 ? userId : null;
}