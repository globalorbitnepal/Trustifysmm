import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STEP_SECONDS = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * 32-byte AES-256 key from TOTP_ENCRYPTION_KEY.
 * Accepts standard base64 or 64 hex characters. The value is never logged.
 */
export function totpEncryptionKey(): Buffer | null {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      const hex = Buffer.from(raw, "hex");
      return hex.length === 32 ? hex : null;
    }
    const key = Buffer.from(raw, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

export const AUTHENTICATOR_ISSUER = "TrustifySMM";

/**
 * The authenticator entry name is TrustifySMM only.
 * The customer email is not part of the label, so the app does not show it.
 */
export function provisioningUri(secret: string) {
  const issuer = AUTHENTICATOR_ISSUER;
  const query = [
    `secret=${encodeURIComponent(secret)}`,
    `issuer=${encodeURIComponent(issuer)}`,
    "algorithm=SHA1",
    `digits=${DIGITS}`,
    `period=${STEP_SECONDS}`,
  ].join("&");
  return `otpauth://totp/${encodeURIComponent(issuer)}?${query}`;
}

export function hotp(secretBase32: string, counter: number) {
  const secret = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 1_000_000).padStart(DIGITS, "0");
}

export function totpCode(secretBase32: string, now = Date.now()) {
  const counter = Math.floor(now / 1000 / STEP_SECONDS);
  return { code: hotp(secretBase32, counter), counter };
}

export type TotpMatch = { ok: true; step: number } | { ok: false; reason: "invalid" | "expired" | "replay" };

/** Accept the current step and one step of clock skew. A step already used is a replay. */
export function matchTotp(secretBase32: string, code: string, lastStep: number | null, now = Date.now()): TotpMatch {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return { ok: false, reason: "invalid" };
  const current = Math.floor(now / 1000 / STEP_SECONDS);
  const window = [0, -1, 1].map((delta) => current + delta);
  let replay = false;
  for (const step of window) {
    if (!sameCode(hotp(secretBase32, step), normalized)) continue;
    if (lastStep != null && step <= lastStep) {
      replay = true;
      continue;
    }
    return { ok: true, step };
  }
  if (replay) return { ok: false, reason: "replay" };
  if (sameCode(hotp(secretBase32, current - 2), normalized) || sameCode(hotp(secretBase32, current - 3), normalized)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: false, reason: "invalid" };
}

export function encryptSecret(secret: string): string | null {
  const key = totpEncryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string | null {
  const key = totpEncryptionKey();
  if (!key) return null;
  const [ivRaw, tagRaw, dataRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const plain = Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}

export function generateRecoveryCodes(count = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  while (codes.length < count) {
    let raw = "";
    const bytes = randomBytes(10);
    for (const byte of bytes) raw += alphabet[byte % alphabet.length];
    const code = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function hashRecoveryCode(code: string) {
  const key = totpEncryptionKey();
  const pepper = key ? key.toString("base64url") : "missing-key";
  const normalized = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return createHash("sha256").update(`${pepper}:${normalized}`).digest("hex");
}

export function recoveryCodeMatches(code: string, hash: string) {
  const digest = hashRecoveryCode(code);
  try {
    const a = Buffer.from(digest, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sameCode(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function base32Encode(data: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string) {
  const clean = input.replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
