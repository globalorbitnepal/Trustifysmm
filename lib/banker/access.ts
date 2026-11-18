import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * High-entropy, payment-specific access token.
 *
 * 256 bits of randomness, base64url encoded (43 chars). Only the SHA-256 hash is stored on
 * the invoice, so a leaked data file cannot be replayed as a bearer token. The plaintext is
 * returned exactly once, to the caller that created the invoice.
 *
 * Scope: read-only access to that single deposit. It never authorises a credit, a status
 * change, or access to any other deposit.
 */
export function createDepositAccessToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDepositAccessToken(token) };
}

export function hashDepositAccessToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Constant-time comparison of a presented token against the stored hash. */
export function verifyDepositAccessToken(presented: string | null | undefined, storedHash: string | null | undefined) {
  if (!presented || !storedHash) return false;
  const candidate = Buffer.from(hashDepositAccessToken(presented), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (candidate.length !== expected.length) return false;
  try {
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison for secrets such as API keys.
 * Both sides are hashed first so the comparison length never leaks the secret length.
 */
export function constantTimeEquals(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const left = Buffer.from(createHash("sha256").update(a, "utf8").digest());
  const right = Buffer.from(createHash("sha256").update(b, "utf8").digest());
  return timingSafeEqual(left, right);
}

/** Header that carries the deposit access token. Never a query parameter. */
export const DEPOSIT_TOKEN_HEADER = "x-deposit-token";

export function depositTokenFromRequest(request: Request): string {
  return request.headers.get(DEPOSIT_TOKEN_HEADER)?.trim() ?? "";
}
