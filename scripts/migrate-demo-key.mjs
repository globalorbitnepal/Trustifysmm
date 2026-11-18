#!/usr/bin/env node
/**
 * One-time demo credential migration (Option A — demo account disabled).
 *
 * Retires any account still holding a denylisted public default key: the account is revoked and
 * its plaintext key is deleted. When DEMO_API_KEY is not set — the Option A configuration — the
 * demo account is left with no usable credential at all.
 *
 * SAFETY
 *  - `--dry-run` never writes. It is the default recommendation and prints only counts/emails.
 *  - Before writing, the current store is copied to a timestamped backup next to it.
 *  - The write is atomic: temp file + fsync + rename, so a crash cannot truncate the store.
 *  - Only denylisted key material is touched. Every other account is left byte-for-byte intact.
 *  - Idempotent: a second run finds no denylisted keys and reports "nothing to change".
 *  - Never prints, logs, or persists plaintext key material.
 *
 * Usage:
 *   node scripts/migrate-demo-key.mjs --dry-run
 *   node scripts/migrate-demo-key.mjs
 *
 * Run with the service stopped, or immediately before the restart, because a concurrent request
 * holds the store in memory and would rewrite the file from its own copy.
 */
import { createHash } from "node:crypto";
import { copyFile, readFile, rename, open, unlink, stat, chmod } from "node:fs/promises";
import path from "node:path";

const STORE = path.join(process.cwd(), "data", "runtime", "api-store.json");
const RETIRED_HASHES = new Set(["2ef9cfb9a8a7f4079e73d3a846f2f21925838132ee89d3cd3062fdb93fafe73b"]);
const DEMO_EMAIL = "demo@trustifysmm.com";
const BACKUP_DIR = process.env.TSM_BACKUP_DIR?.trim() || "/home/sysadmin/backups/trustifysmm";

const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const isRetired = (key) =>
  Boolean(key) && (RETIRED_HASHES.has(sha256(key)) || key.trim().toLowerCase().startsWith("trustify-demo-key"));

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

const configured = (process.env.DEMO_API_KEY ?? "").trim();
const demoKeyValid = Boolean(configured) && !isRetired(configured) && configured.length >= 32;

function log(line) {
  console.log(line);
}

/** Write via temp file + fsync + rename so the store is never left half-written. */
async function writeAtomic(target, contents) {
  // Preserve the existing file mode so ownership/permission expectations are unchanged.
  let mode = 0o644;
  try {
    mode = (await stat(target)).mode & 0o777;
  } catch {
    /* new file: fall back to 0644 */
  }
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const handle = await open(tmp, "w", mode);
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(tmp, mode);
  try {
    await rename(tmp, target);
  } catch (error) {
    await unlink(tmp).catch(() => {});
    throw error;
  }
}

async function backupStore() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, `api-store.pre-demo-migration-${stamp}.json`);
  await copyFile(STORE, dest);
  return dest;
}

async function main() {
  let store;
  try {
    store = JSON.parse(await readFile(STORE, "utf8"));
  } catch (error) {
    console.error(`Cannot read ${STORE}: ${error.code ?? "error"}`);
    process.exitCode = 1;
    return;
  }
  store.accounts ??= [];

  let changed = 0;
  const quarantined = [];

  for (const account of store.accounts) {
    const material = account.keyHash ?? (account.key ? sha256(account.key) : "");
    const retired = isRetired(account.key) || RETIRED_HASHES.has(material);
    if (!retired) continue;
    account.revoked = true;
    delete account.key;
    delete account.keyHash;
    quarantined.push(account.email);
    changed += 1;
  }

  log(`mode                  : ${dryRun ? "DRY RUN (no writes)" : "APPLY"}`);
  log(`store                 : ${path.relative(process.cwd(), STORE)}`);
  log(`accounts scanned      : ${store.accounts.length}`);
  log(`retired keys found    : ${quarantined.length}${quarantined.length ? ` (${quarantined.join(", ")})` : ""}`);

  const demo = store.accounts.find((row) => (row.email ?? "").toLowerCase() === DEMO_EMAIL);
  const demoWasQuarantined = quarantined.some((email) => email.toLowerCase() === DEMO_EMAIL);

  if (!demo) {
    log("demo account          : not present in store");
  } else if (demoKeyValid) {
    const wantedHash = sha256(configured);
    if (demo.keyHash === wantedHash && !demo.revoked && !demo.key) {
      log("demo account          : already matches DEMO_API_KEY, no change needed");
    } else {
      demo.keyHash = wantedHash;
      demo.revoked = false;
      delete demo.key;
      changed += 1;
      log("demo account          : configured DEMO_API_KEY installed (hash only), account enabled");
    }
  } else if (demoWasQuarantined) {
    // The retired-key pass above already revoked it and stripped the credential.
    log("demo account          : OPTION A — retired key revoked, credential stripped, account disabled");
  } else if (demo.revoked === true && !demo.key && !demo.keyHash) {
    log("demo account          : already disabled with no credential, no change needed");
  } else {
    demo.revoked = true;
    delete demo.key;
    delete demo.keyHash;
    changed += 1;
    log("demo account          : OPTION A — disabled, no usable credential (fail closed)");
  }

  if (!changed) {
    log("result                : nothing to change");
    return;
  }
  if (dryRun) {
    log(`result                : dry run complete, ${changed} change(s) NOT written`);
    return;
  }

  const backup = await backupStore();
  await writeAtomic(STORE, JSON.stringify(store, null, 2));
  log(`backup                : ${path.relative(process.cwd(), backup)}`);
  log(`result                : ${changed} change(s) written to ${path.relative(process.cwd(), STORE)}`);

  const stillRetired = store.accounts.some((row) => row.key && isRetired(row.key));
  log(`retired plaintext keys remaining: ${stillRetired ? "YES (investigate)" : "none"}`);
}

await main();
