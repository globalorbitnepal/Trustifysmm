import { randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = "totp-test-session-secret-32chars";

import { finishGoogleLogin, finishPasswordLogin } from "@/lib/customer/complete-login";
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
import { setupQr } from "@/lib/customer/totp-qr";
import {
  beginTotpEnrollment,
  clearTotp,
  confirmTotpEnrollment,
  deleteAuthenticator,
  pauseAuthenticator,
  resumeAuthenticator,
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

  it("stores the secret encrypted and never as plaintext", async () => {
    const secret = generateTotpSecret();
    const enc = encryptSecret(secret);
    expect(enc).toBeTruthy();
    expect(enc).not.toContain(secret);
    expect(decryptSecret(enc!)).toBe(secret);
    const uri = provisioningUri(secret);
    expect(uri).toBe(
      `otpauth://totp/TrustifySMM?secret=${secret}&issuer=TrustifySMM&algorithm=SHA1&digits=6&period=30`,
    );
    expect(uri).not.toMatch(/@|nowpayment/i);
    const image = await setupQr(secret);
    expect(image.uri).toBe(uri);
    expect(image.uri.startsWith("otpauth://totp/TrustifySMM?")).toBe(true);
    expect(image.qr.startsWith("data:image/png;base64,")).toBe(true);
    expect(image.qr.length).toBeGreaterThan(2000);
  });

  it("accepts a 32-byte hex encryption key and rejects a short one", () => {
    const previous = process.env.TOTP_ENCRYPTION_KEY;
    process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    const secret = generateTotpSecret();
    const enc = encryptSecret(secret);
    expect(decryptSecret(enc!)).toBe(secret);
    process.env.TOTP_ENCRYPTION_KEY = "too-short";
    expect(encryptSecret(secret)).toBeNull();
    process.env.TOTP_ENCRYPTION_KEY = previous;
  });
});

describe("enrollment", () => {
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
    if (!("activatedAt" in confirmed)) throw new Error("activation failed");
    expect((await totpStatus(userId)).enabled).toBe(true);
    expect(confirmed).not.toHaveProperty("recoveryCodes");

    const reused = await verifyTotpForUser(userId, code);
    expect(reused).toEqual({ error: "That code was already used." });

    await clearTotp(userId);
    expect((await totpStatus(userId)).enabled).toBe(false);
    expect(await verifyTotpForUser(userId, code)).toEqual({ error: "Authenticator is not enabled." });
  });
});

describe("daily authenticator limit", () => {
  const userId = "usr_totp_quota";

  it("turns the saved entry off and on, then allows only 3 deletes and 3 new activations in a day", async () => {
    const base = Date.now();
    const at = (step: number) => new Date(base + step * 31_000);

    const first = await beginTotpEnrollment(userId, "quota@example.com", at(0));
    if (!("secret" in first)) throw new Error("setup failed");
    await confirmTotpEnrollment(userId, totpCode(first.secret, at(0).getTime()).code, at(0));

    const paused = await pauseAuthenticator(userId, totpCode(first.secret, at(1).getTime()).code, at(1));
    expect(paused).toMatchObject({ ok: true });
    expect((await totpStatus(userId)).enabled).toBe(false);
    expect((await totpStatus(userId)).saved).toBe(true);
    expect(await verifyTotpForUser(userId, totpCode(first.secret, at(2).getTime()).code)).toEqual({ error: "Authenticator is not enabled." });

    const resumed = await resumeAuthenticator(userId, totpCode(first.secret, at(2).getTime()).code, at(2));
    expect(resumed).toMatchObject({ ok: true });
    expect((await totpStatus(userId)).enabled).toBe(true);
    expect((await totpStatus(userId, at(2))).usage.activate).toBe(1);

    const removed = await deleteAuthenticator(userId, totpCode(first.secret, at(3).getTime()).code, at(3));
    expect(removed).toMatchObject({ ok: true });
    expect((await totpStatus(userId, at(3))).saved).toBe(false);
    expect((await totpStatus(userId, at(3))).usage.delete).toBe(1);

    for (const step of [4, 6]) {
      const started = await beginTotpEnrollment(userId, "quota@example.com", at(step));
      if (!("secret" in started)) throw new Error(`setup ${step} failed`);
      const turnedOn = await confirmTotpEnrollment(userId, totpCode(started.secret, at(step).getTime()).code, at(step));
      expect(turnedOn).not.toHaveProperty("error");
      const deleted = await deleteAuthenticator(userId, totpCode(started.secret, at(step + 1).getTime()).code, at(step + 1));
      expect(deleted).toMatchObject({ ok: true });
    }

    expect((await totpStatus(userId, at(8))).usage).toMatchObject({ activate: 3, delete: 3, activateRemaining: 0, deleteRemaining: 0 });
    expect(await beginTotpEnrollment(userId, "quota@example.com", at(8))).toEqual({
      error: "Authenticator can be turned on 3 times a day. Try again tomorrow.",
    });
    await clearTotp(userId);
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

    const google = await finishGoogleLogin(user, "127.0.0.1", "https://trustifysmm.com");
    expect(google.headers.get("location")).toBe("https://trustifysmm.com/signin?totp=1");
    const googleCookie = google.headers.get("set-cookie") || "";
    expect(googleCookie).toContain("trustify_2fa=");
    expect(googleCookie).not.toContain("trustify_session=");
  });
});
