import { createHmac, timingSafeEqual } from "node:crypto";

/** Recursively sort object keys (NOWPayments IPN requirement). */
export function sortNowPaymentsPayload(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortNowPaymentsPayload(obj[key]);
  }
  return sorted;
}

export function signNowPaymentsPayload(payload: unknown, secret: string) {
  const sorted = sortNowPaymentsPayload(payload);
  const body = JSON.stringify(sorted);
  return createHmac("sha512", secret).update(body).digest("hex");
}

export function verifyNowPaymentsIpnSignature(rawJson: string, signatureHeader: string | null, secret: string) {
  if (!secret || !signatureHeader?.trim()) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    return false;
  }
  const expected = signNowPaymentsPayload(parsed, secret);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader.trim(), "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}