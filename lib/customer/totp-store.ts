import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  matchTotp,
  provisioningUri,
} from "@/lib/customer/totp";

export type TotpRecord = {
  enabled: boolean;
  secretEnc: string | null;
  pendingSecretEnc: string | null;
  pendingExpiresAt: string | null;
  activatedAt: string | null;
  lastStep: number | null;
  recoveryHashes: string[];
};

const DAILY_LIMIT = 3;
const DAY_ZONE = "Asia/Kathmandu";

export type AuthenticatorUsage = {
  limit: number;
  activate: number;
  delete: number;
  activateRemaining: number;
  deleteRemaining: number;
};

type UsageRow = { day: string; activate: number; delete: number };
type FileShape = { records: Record<string, TotpRecord>; usage?: Record<string, UsageRow> };

export function authenticatorDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DAY_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function usageRow(file: FileShape, userId: string, now = new Date()): UsageRow {
  const day = authenticatorDay(now);
  const current = file.usage?.[userId];
  if (!current || current.day !== day) return { day, activate: 0, delete: 0 };
  return { day, activate: Number(current.activate) || 0, delete: Number(current.delete) || 0 };
}

function usageView(row: UsageRow): AuthenticatorUsage {
  return {
    limit: DAILY_LIMIT,
    activate: row.activate,
    delete: row.delete,
    activateRemaining: Math.max(0, DAILY_LIMIT - row.activate),
    deleteRemaining: Math.max(0, DAILY_LIMIT - row.delete),
  };
}

const ACTIVATE_LIMIT = "Authenticator can be turned on 3 times a day. Try again tomorrow.";
const DELETE_LIMIT = "Google Authenticator can be deleted 3 times a day. Try again tomorrow.";

const EMPTY: TotpRecord = {
  enabled: false,
  secretEnc: null,
  pendingSecretEnc: null,
  pendingExpiresAt: null,
  activatedAt: null,
  lastStep: null,
  recoveryHashes: [],
};

let chain: Promise<unknown> = Promise.resolve();

function filePath() {
  return path.join(process.cwd(), "data", "runtime", "customer-totp.json");
}

function locked<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readFileShape(): Promise<FileShape> {
  try {
    const parsed = JSON.parse(await readFile(filePath(), "utf8")) as FileShape;
    if (!parsed.records || typeof parsed.records !== "object") return { records: {}, usage: {} };
    if (!parsed.usage || typeof parsed.usage !== "object") parsed.usage = {};
    return parsed;
  } catch {
    return { records: {}, usage: {} };
  }
}

async function writeFileShape(file: FileShape) {
  await mkdir(path.dirname(filePath()), { recursive: true });
  await writeFile(filePath(), JSON.stringify(file), "utf8");
}

export async function totpStatus(userId: string, now = new Date()) {
  const file = await readFileShape();
  const row = file.records[userId];
  return {
    enabled: Boolean(row?.enabled),
    activatedAt: row?.activatedAt ?? null,
    saved: Boolean(row?.secretEnc),
    usage: usageView(usageRow(file, userId, now)),
  };
}

export async function beginTotpEnrollment(
  userId: string,
  email: string,
  now = new Date(),
): Promise<{ error: string } | { secret: string; account: string; mode: "Time-based" }> {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId] ?? { ...EMPTY };
    if (current.enabled) return { error: "Authenticator is already enabled." as const };
    if (current.secretEnc) return { error: "Authenticator is turned off. Turn it on with the 6-digit code, or delete Google Authenticator first." as const };
    if (usageRow(file, userId, now).activate >= DAILY_LIMIT) return { error: ACTIVATE_LIMIT };
    const secret = generateTotpSecret();
    const secretEnc = encryptSecret(secret);
    if (!secretEnc) return { error: "Authenticator encryption is not configured." as const };
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    file.records[userId] = {
      ...current,
      enabled: false,
      pendingSecretEnc: secretEnc,
      pendingExpiresAt: expires,
    };
    await writeFileShape(file);
    /* The URI name is TrustifySMM only. The email is not written into the authenticator entry. */
    provisioningUri(secret);
    void email;
    return { secret, account: "TrustifySMM", mode: "Time-based" as const };
  });
}

export async function confirmTotpEnrollment(userId: string, code: string, now = new Date()) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.pendingSecretEnc || !current.pendingExpiresAt) {
      return { error: "Start authenticator setup again." as const };
    }
    if (Date.parse(current.pendingExpiresAt) < now.getTime()) {
      return { error: "Setup expired. Start again." as const };
    }
    const slot = usageRow(file, userId, now);
    if (slot.activate >= DAILY_LIMIT) return { error: ACTIVATE_LIMIT };
    const secret = decryptSecret(current.pendingSecretEnc);
    if (!secret) return { error: "Authenticator encryption is not configured." as const };
    const match = matchTotp(secret, code, null, now.getTime());
    if (!match.ok) return { error: codeError(match.reason) };
    slot.activate += 1;
    file.usage = { ...file.usage, [userId]: slot };
    file.records[userId] = {
      enabled: true,
      secretEnc: current.pendingSecretEnc,
      pendingSecretEnc: null,
      pendingExpiresAt: null,
      activatedAt: now.toISOString(),
      lastStep: match.step,
      recoveryHashes: [],
    };
    await writeFileShape(file);
    return { activatedAt: file.records[userId].activatedAt, usage: usageView(slot) };
  });
}

/** Turn the sign-in code off and keep the same authenticator entry. */
export async function pauseAuthenticator(userId: string, code: string, now = new Date()) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.enabled || !current.secretEnc) return { error: "Authenticator is not enabled." as const };
    const proved = prove(current, code, now);
    if ("error" in proved) return proved;
    current.enabled = false;
    current.lastStep = proved.step;
    file.records[userId] = current;
    await writeFileShape(file);
    return { ok: true as const, usage: usageView(usageRow(file, userId, now)) };
  });
}

/** Turn the saved authenticator entry back on. This does not count as a new activation. */
export async function resumeAuthenticator(userId: string, code: string, now = new Date()) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (current?.enabled) return { error: "Authenticator is already enabled." as const };
    if (!current?.secretEnc) return { error: "Authenticator is not set up." as const };
    const proved = prove(current, code, now);
    if ("error" in proved) return proved;
    current.enabled = true;
    current.lastStep = proved.step;
    file.records[userId] = current;
    await writeFileShape(file);
    return { ok: true as const, usage: usageView(usageRow(file, userId, now)) };
  });
}

/** Remove the authenticator from the account. The customer can set it up again, up to 3 deletes a day. */
export async function deleteAuthenticator(userId: string, code: string, now = new Date()) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.secretEnc) return { error: "Authenticator is not set up." as const };
    const slot = usageRow(file, userId, now);
    if (slot.delete >= DAILY_LIMIT) return { error: DELETE_LIMIT };
    const proved = prove(current, code, now);
    if ("error" in proved) return proved;
    slot.delete += 1;
    file.usage = { ...file.usage, [userId]: slot };
    delete file.records[userId];
    await writeFileShape(file);
    return { ok: true as const, usage: usageView(slot) };
  });
}

/** Current secret for an enabled account, so an existing entry can be scanned again under the name TrustifySMM. */
export async function enabledTotpSecret(userId: string) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.enabled || !current.secretEnc) return { error: "Authenticator is not enabled." as const };
    const secret = decryptSecret(current.secretEnc);
    if (!secret) return { error: "Authenticator encryption is not configured." as const };
    if (current.recoveryHashes.length) {
      current.recoveryHashes = [];
      file.records[userId] = current;
      await writeFileShape(file);
    }
    return { secret };
  });
}

export async function verifyTotpForUser(userId: string, code: string) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.enabled || !current.secretEnc) return { error: "Authenticator is not enabled." as const };
    const secret = decryptSecret(current.secretEnc);
    if (!secret) return { error: "Authenticator encryption is not configured." as const };
    const match = matchTotp(secret, code, current.lastStep);
    if (!match.ok) return { error: codeError(match.reason) };
    current.lastStep = match.step;
    file.records[userId] = current;
    await writeFileShape(file);
    return { ok: true as const };
  });
}

export async function consumeRecoveryCode(_userId: string, _code: string) {
  return { error: "Enter the 6-digit code from Google Authenticator." as const };
}

export async function regenerateRecoveryCodes(_userId: string) {
  return { error: "Recovery codes are not used. Enter the 6-digit code from Google Authenticator." as const };
}

export async function clearTotp(userId: string) {
  return locked(async () => {
    const file = await readFileShape();
    delete file.records[userId];
    await writeFileShape(file);
    return { ok: true as const };
  });
}

function prove(current: TotpRecord, code: string, now: Date) {
  if (!current.secretEnc) return { error: "Authenticator is not set up." as const };
  const secret = decryptSecret(current.secretEnc);
  if (!secret) return { error: "Authenticator encryption is not configured." as const };
  const match = matchTotp(secret, code, current.lastStep, now.getTime());
  if (!match.ok) return { error: codeError(match.reason) };
  return { step: match.step };
}

function codeError(reason: "invalid" | "expired" | "replay") {
  if (reason === "expired") return "That code has expired. Wait for the next code." as const;
  if (reason === "replay") return "That code was already used." as const;
  return "That code is not valid." as const;
}
