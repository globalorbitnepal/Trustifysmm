import { randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = "totp-test-session-secret-32chars";

import { finishPasswordLogin } from "@/lib/customer/complete-login";
import { createPendingLoginToken, readPendingLoginToken } from "@/lib/customer/pending-login";
import { parseCustomerSessionToken } from "@/lib/customer/session";
import {
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  hotp,
  matchTotp,
  provisioningUri,
  totpCode,
} from "@/lib/customer/totp";
import {
  beginTotpEnrollment,
  clearTotp,
  confirmTotpEnrollment,
  consumeRecoveryCode,
  regenerateRecoveryCodes,
  totpStatus,
  verifyTotpForUser,
} from "@/lib/customer/totp-store";
import type { CustomerUser } from "@/lib/customer/types";

const original = process.cwd();

beforeAll(() => {
  process.chdir(mkdtempSync(path.join(tmpdir(), "trustify-totp-")));
});

afterAll(() => {
  process.chdir(original);
});

describe("authenticator codes", () => {
  it("accepts the current code and rejects a wrong one", () => {
    const secret = generateTotpSecret();
    const now = Date.UTC(2026, 0, 1, 0, 0, 10);
    const { code, counter } = totpCode(secret, now);
    expect(code).toHaveLength(6);
    expect(matchTotp(secret, code, null, now)).toEqual({ ok: true, step: counter });
    expect(matchTotp(secret, "000000", null, now).ok).toBe(false);
  });

  it("rejects an expired code and a reused code", () => {
    const secret = generateTotpSecret();
    const now = Date.UTC(2026, 0, 1, 0, 2, 0);
    const old = totpCode(secret, now - 90_000);
    expect(matchTotp(secret, old.code, null, now)).toEqual({ ok: false, reason: "expired" });
    const current = totpCode(secret, now);
    expect(matchTotp(secret, current.code, current.counter, now)).toEqual({ ok: false, reason: "replay" });
  });

  it("stores the secret encrypted and never as plaintext", () => {
    const secret = generateTotpSecret();
    const enc = encryptSecret(secret);
    expect(enc).toBeTruthy();
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc!)).toBe(secret);
    expect(provisioningUri(secret, "a@b.com")).toContain("algorithm=SHA1");
    expect(provisioningUri(secret, "a@b.com")).not.toContain("qr");
  });
});

describe("enrollment and recovery", () => {
  const userId = "usr_totp_test";

  it("does not enable authenticator until the setup code is correct", async () => {
    const started = await beginTotpEnrollment(userId, "totp@example.com");
    expect("secret" in started).toBe(true);
    expect((await totpStatus(userId)).enabled).toBe(false);
    if (!("secret" in started)) return;
    const wrong = await confirmTotpEnrollment(userId, "111111");
    expect(wrong).toEqual({ error: "That code is not valid." });
    expect((await totpStatus(userId)).enabled).toBe(false);

    const code = totpCode(started.secret).code;
    const confirmed = await confirmTotpEnrollment(userId, code);
    if (!("recoveryCodes" in confirmed) || !confirmed.recoveryCodes) throw new Error("activation failed");
    expect((await totpStatus(userId)).enabled).toBe(true);
    expect(confirmed.recoveryCodes).toHaveLength(10);

    const reused = await verifyTotpForUser(userId, code);
    expect(reused).toEqual({ error: "That code was already used." });

    const recovery = confirmed.recoveryCodes[0];
    if (!recovery) throw new Error("missing recovery code");
    expect(await consumeRecoveryCode(userId, recovery)).toMatchObject({ ok: true });
    expect(await consumeRecoveryCode(userId, recovery)).toEqual({ error: "That recovery code is not valid." });

    const replaced = await regenerateRecoveryCodes(userId);
    expect("recoveryCodes" in replaced).toBe(true);
    expect(await consumeRecoveryCode(userId, recovery)).toEqual({ error: "That recovery code is not valid." });
    if (!("recoveryCodes" in replaced) || !replaced.recoveryCodes?.[0]) throw new Error("regenerate failed");
    expect(await consumeRecoveryCode(userId, replaced.recoveryCodes[0])).toMatchObject({ ok: true });

    await clearTotp(userId);
    expect((await totpStatus(userId)).enabled).toBe(false);
    expect(await verifyTotpForUser(userId, code)).toEqual({ error: "Authenticator is not enabled." });
  });
});

describe("login second factor", () => {
  it("does not create a dashboard session when authenticator is on", async () => {
    const id = "usr_login_gate";
    const started = await beginTotpEnrollment(id, "gate@example.com");
    if (!("secret" in started)) throw new Error("setup failed");
    await confirmTotpEnrollment(id, totpCode(started.secret).code);
    const user = { id, email: "gate@example.com", sessionVersion: 1, balance: 0 } as CustomerUser;
    const res = await finishPasswordLogin(user, true, "127.0.0.1");
    const body = await res.json();
    expect(body).toEqual({ twoFactor: true });
    const cookie = res.headers.get("set-cookie") || "";
    expect(cookie).toContain("trustify_2fa=");
    expect(cookie).not.toContain("trustify_session=");
    const token = createPendingLoginToken({ userId: id, remember: true, method: "google" });
    expect(readPendingLoginToken(token)?.userId).toBe(id);
    expect(parseCustomerSessionToken(token)).toBeNull();
    expect(hotp(started.secret, 1)).toMatch(/^\d{6}$/);
  });
});
