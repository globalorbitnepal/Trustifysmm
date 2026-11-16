/** Edge-safe Orbit session auth (middleware + API routes). No node:crypto. */

const COOKIE_NAME = "orbit_session";

export function orbitPasskey() {
  return process.env.ORBIT_PASSKEY?.trim() ?? "";
}

export function verifyPasskey(input: string) {
  const expected = orbitPasskey();
  if (!expected) return false;
  const a = input.trim();
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ a.charCodeAt(i);
  }
  return diff === 0;
}

function bufferToHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(message: string) {
  const secret = orbitPasskey();
  if (!secret) throw new Error("ORBIT_PASSKEY not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bufferToHex(sig);
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createOrbitSessionToken() {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);
  const signature = await hmacHex(`orbit:${payload}`);
  return `${payload}.${signature}`;
}

export async function verifyOrbitSessionToken(token: string | undefined | null) {
  if (!token || !orbitPasskey()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await hmacHex(`orbit:${payload}`);
  return safeEqualHex(expected, signature);
}

export { COOKIE_NAME as ORBIT_COOKIE_NAME };