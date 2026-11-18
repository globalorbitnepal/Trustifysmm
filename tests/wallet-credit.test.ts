import { mkdtempSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Orbit wallet credit/debit against a copy of the real runtime data.
 *
 * The copy means production balances are untouched, while the customers and wallets are the
 * actual records an admin sees in the Customer Wallets screen.
 */
let store: typeof import("@/lib/smm-api/demo-store");
let users: { id: string; email: string; apiKey: string }[];
const dir = mkdtempSync(path.join(tmpdir(), "trustify-wallet-"));

beforeAll(async () => {
  mkdirSync(path.join(dir, "data", "runtime"), { recursive: true });
  for (const file of ["api-store.json", "customers.json", "customer-panel.json"]) {
    copyFileSync(path.join(process.cwd(), "data", "runtime", file), path.join(dir, "data", "runtime", file));
  }
  process.chdir(dir);
  users = (JSON.parse(readFileSync(path.join(dir, "data", "runtime", "customers.json"), "utf8")) as {
    users: { id: string; email: string; apiKey: string }[];
  }).users;
  store = await import("@/lib/smm-api/demo-store");
});

describe("every Orbit customer has a usable wallet", () => {
  it("finds a wallet for every customer in the list", async () => {
    const missing: string[] = [];
    for (const user of users) {
      const wallet = await store.getAccountByKey(user.apiKey);
      if (!wallet) missing.push(user.email);
    }
    expect(missing).toEqual([]);
  });

  it("credits each customer and writes the ledger row", async () => {
    for (const user of users) {
      const before = await store.getAccountByKey(user.apiKey);
      const credited = await store.adjustAccount(user.apiKey, 5, "Orbit credit: audit", `audit-credit-${user.id}`);
      if ("error" in credited) throw new Error(`${user.email}: ${credited.error}`);
      expect(credited.account.balance).toBeCloseTo((before?.balance ?? 0) + 5, 4);

      const ledger = await store.listLedger(user.apiKey);
      const row = ledger.find((entry) => entry.ref === `audit-credit-${user.id}`);
      expect(row?.amount).toBe(5);
      expect(row?.balanceAfter).toBeCloseTo(credited.account.balance, 4);
    }
  });

  it("debits back to the starting balance", async () => {
    for (const user of users) {
      const before = await store.getAccountByKey(user.apiKey);
      const start = before?.balance ?? 0;
      const debited = await store.adjustAccount(user.apiKey, -5, "Orbit debit: audit", `audit-debit-${user.id}`);
      if ("error" in debited) throw new Error(`${user.email}: ${debited.error}`);
      expect(debited.account.balance).toBeCloseTo(start - 5, 4);
    }
  });

  it("refuses to overdraw the wallet", async () => {
    const user = users[0];
    const wallet = await store.getAccountByKey(user.apiKey);
    const tooMuch = await store.adjustAccount(user.apiKey, -((wallet?.balance ?? 0) + 1), "Orbit debit: audit");
    expect("error" in tooMuch).toBe(true);
  });

  it("refuses a repeated reference so a credit cannot be applied twice", async () => {
    const user = users[0];
    const first = await store.adjustAccount(user.apiKey, 1, "Orbit credit: one", "dup-ref-audit");
    expect("error" in first).toBe(false);
    const second = await store.adjustAccount(user.apiKey, 1, "Orbit credit: one", "dup-ref-audit");
    expect("error" in second).toBe(true);
  });

  it("creates the wallet for a real customer whose record is missing", async () => {
    /* A customer created before wallets were provisioned must not see "Wallet not found". */
    const orphanKey = "tsm_orphan_wallet_audit_0000000000";
    expect(await store.getAccountByKey(orphanKey)).toBeNull();

    const resolved = await store.ensureAccountForCustomer({ email: "orphan@example.com", key: orphanKey });
    if (!("account" in resolved) || !resolved.account) throw new Error("wallet was not created");
    expect(resolved.created).toBe(true);
    expect(resolved.account.balance).toBe(0);

    const credited = await store.adjustAccount(orphanKey, 12.5, "Orbit credit: opening balance", undefined, "orphan@example.com");
    if ("error" in credited) throw new Error(credited.error);
    expect(credited.account.balance).toBe(12.5);

    /* Calling it again must not reset a funded wallet. */
    const again = await store.ensureAccountForCustomer({ email: "orphan@example.com", key: orphanKey });
    if (!("account" in again) || !again.account) throw new Error("wallet disappeared");
    expect(again.created).toBe(false);
    expect(again.account.balance).toBe(12.5);
  });

  it("still credits a customer through the admin path when the wallet is absent", async () => {
    const orphanKey = "tsm_orphan_credit_path_000000000";
    const result = await store.adjustAccount(orphanKey, 3, "Orbit credit: admin path", undefined, "late@example.com");
    if ("error" in result) throw new Error(result.error);
    expect(result.createdWallet).toBe(true);
    expect(result.account.balance).toBe(3);
  });
});
