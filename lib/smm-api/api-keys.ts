import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Demo/reseller API key handling.
 *
 * Design rules (security audit, B1 follow-up):
 *  - No hardcoded default key exists anywhere in the source. The previous public default is
 *    permanently denylisted so an existing store that still holds it cannot authenticate.
 *  - New keys are generated with `crypto.randomBytes`.
 *  - Only a SHA-256 hash is stored, in `keyHash`. Plaintext exists only in the response that
 *    returns it to its owner, and only once.
 *  - A store that predates hashing may still carry `key` (plaintext). It is migrated on the
 *    next write, and the denylisted value is refused even before migration.
 */

const KEY_BYTES = 24; // 192 bits
export const API_KEY_PREFIX = "tsm_";

/** SHA-256 of the retired hardcoded default. The plaintext is deliberately not in the repo. */
const DENYLISTED_KEY_HASHES = new Set<string>([
  // Previously published development/demo default. Retired permanently.
  "2ef9cfb9a8a7f4079e73d3a846f2f21925838132ee89d3cd3062fdb93fafe73b",
]);

export type StoredApiKey = {
  /** SHA-256 hex of the key. Preferred field. */
  keyHash?: string;
  /** Legacy plaintext field. Migrated to `keyHash` on the next write. */
  key?: string;
};

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** Generate a new API key. The plaintext is returned exactly once, to be shown to its owner. */
export function generateApiKey(): { key: string; keyHash: string } {
  const key = `${API_KEY_PREFIX}${randomBytes(KEY_BYTES).toString("hex")}`;
  return { key, keyHash: hashApiKey(key) };
}

export function isDenylistedKey(key: string): boolean {
  const digest = hashApiKey(key);
  if (DENYLISTED_KEY_HASHES.has(digest)) return true;
  // The retired default is also rejected by shape: it was not prefixed and was human-readable.
  return key.trim().toLowerCase().startsWith("trustify-demo-key");
}

/** Same check when only a stored hash is available. */
export function isDenylistedKeyHash(hash: string): boolean {
  return DENYLISTED_KEY_HASHES.has(hash.toLowerCase());
}

function safeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Constant-time check that `presented` is the key recorded on `record`.
 * Returns false for denylisted keys, empty input, and records with no usable material.
 */
export function keyMatchesRecord(presented: string | null | undefined, record: StoredApiKey): boolean {
  const candidate = (presented ?? "").trim();
  if (!candidate) return false;
  if (isDenylistedKey(candidate)) return false;

  const digest = hashApiKey(candidate);
  if (record.keyHash) return safeEqualHex(digest, record.keyHash);

  // Legacy plaintext record: compare hashes so the comparison stays constant-time, then
  // allow the caller to migrate the record.
  if (record.key) return safeEqualHex(digest, hashApiKey(record.key));
  return false;
}

/** True when a legacy record still needs to be migrated to a hashed key. */
export function needsHashMigration(record: StoredApiKey): boolean {
  return !record.keyHash && Boolean(record.key);
}

/**
 * The demo account key is supplied by the environment only.
 * Returns null when unset — callers must fail closed rather than fall back to a default.
 */
export function demoKeyFromEnv(): string | null {
  const raw = process.env.DEMO_API_KEY?.trim() ?? "";
  if (!raw) return null;
  if (isDenylistedKey(raw)) return null;
  if (raw.length < 32) return null;
  return raw;
}
