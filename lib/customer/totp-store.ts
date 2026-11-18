import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  matchTotp,
  provisioningUri,
  recoveryCodeMatches,
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

type FileShape = { records: Record<string, TotpRecord> };

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
    if (!parsed.records || typeof parsed.records !== "object") return { records: {} };
    return parsed;
  } catch {
    return { records: {} };
  }
}

async function writeFileShape(file: FileShape) {
  await mkdir(path.dirname(filePath()), { recursive: true });
  await writeFile(filePath(), JSON.stringify(file), "utf8");
}

export async function totpStatus(userId: string) {
  const file = await readFileShape();
  const row = file.records[userId];
  return { enabled: Boolean(row?.enabled), activatedAt: row?.activatedAt ?? null };
}

export async function beginTotpEnrollment(
  userId: string,
  email: string,
): Promise<{ error: string } | { secret: string; account: string; mode: "Time-based" }> {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId] ?? { ...EMPTY };
    if (current.enabled) return { error: "Authenticator is already enabled." as const };
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
    /* The URI is built so the secret matches a standard authenticator entry. It is not returned. */
    provisioningUri(secret, email);
    return { secret, account: "TrustifySMM", mode: "Time-based" as const };
  });
}

export async function confirmTotpEnrollment(userId: string, code: string) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.pendingSecretEnc || !current.pendingExpiresAt) {
      return { error: "Start authenticator setup again." as const };
    }
    if (Date.parse(current.pendingExpiresAt) < Date.now()) {
      return { error: "Setup expired. Start again." as const };
    }
    const secret = decryptSecret(current.pendingSecretEnc);
    if (!secret) return { error: "Authenticator encryption is not configured." as const };
    const match = matchTotp(secret, code, null);
    if (!match.ok) return { error: codeError(match.reason) };
    const codes = generateRecoveryCodes(10);
    file.records[userId] = {
      enabled: true,
      secretEnc: current.pendingSecretEnc,
      pendingSecretEnc: null,
      pendingExpiresAt: null,
      activatedAt: new Date().toISOString(),
      lastStep: match.step,
      recoveryHashes: codes.map(hashRecoveryCode),
    };
    await writeFileShape(file);
    return { recoveryCodes: codes, activatedAt: file.records[userId].activatedAt };
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

export async function consumeRecoveryCode(userId: string, code: string) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.enabled) return { error: "Authenticator is not enabled." as const };
    const index = current.recoveryHashes.findIndex((hash) => recoveryCodeMatches(code, hash));
    if (index < 0) return { error: "That recovery code is not valid." as const };
    current.recoveryHashes.splice(index, 1);
    file.records[userId] = current;
    await writeFileShape(file);
    return { ok: true as const, remaining: current.recoveryHashes.length };
  });
}

export async function regenerateRecoveryCodes(userId: string) {
  return locked(async () => {
    const file = await readFileShape();
    const current = file.records[userId];
    if (!current?.enabled) return { error: "Authenticator is not enabled." as const };
    const codes = generateRecoveryCodes(10);
    current.recoveryHashes = codes.map(hashRecoveryCode);
    file.records[userId] = current;
    await writeFileShape(file);
    return { recoveryCodes: codes };
  });
}

export async function clearTotp(userId: string) {
  return locked(async () => {
    const file = await readFileShape();
    delete file.records[userId];
    await writeFileShape(file);
    return { ok: true as const };
  });
}

function codeError(reason: "invalid" | "expired" | "replay") {
  if (reason === "expired") return "That code has expired. Wait for the next code." as const;
  if (reason === "replay") return "That code was already used." as const;
  return "That code is not valid." as const;
}
