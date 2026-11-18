import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  demoKeyFromEnv,
  generateApiKey,
  hashApiKey,
  isDenylistedKey,
  isDenylistedKeyHash,
  keyMatchesRecord,
} from "@/lib/smm-api/api-keys";

/** The retired public default. It must never authenticate again. */
const RETIRED_DEFAULT = "trustify-demo-key-change-me";
const RETIRED_HASH = "2ef9cfb9a8a7f4079e73d3a846f2f21925838132ee89d3cd3062fdb93fafe73b";

const originalCwd = process.cwd();
const originalDemoKey = process.env.DEMO_API_KEY;
let workDir = "";

async function writeStore(store: unknown) {
  await mkdir(path.join(workDir, "data", "runtime"), { recursive: true });
  await writeFile(path.join(workDir, "data", "runtime", "api-store.json"), JSON.stringify(store, null, 1), "utf8");
}

async function readStore() {
  return JSON.parse(await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8"));
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "tsm-demokey-"));
  process.chdir(workDir);
  delete process.env.DEMO_API_KEY;
  vi.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  if (originalDemoKey === undefined) delete process.env.DEMO_API_KEY;
  else process.env.DEMO_API_KEY = originalDemoKey;
  vi.resetModules();
});

describe("retired public default key", () => {
  it("is denylisted by value and by shape", () => {
    expect(isDenylistedKey(RETIRED_DEFAULT)).toBe(true);
    expect(isDenylistedKey("  TRUSTIFY-DEMO-KEY-CHANGE-ME  ")).toBe(true);
    expect(isDenylistedKeyHash(RETIRED_HASH)).toBe(true);
  });

  it("is not a valid record match even if a store still holds it", () => {
    expect(keyMatchesRecord(RETIRED_DEFAULT, { key: RETIRED_DEFAULT })).toBe(false);
    expect(keyMatchesRecord(RETIRED_DEFAULT, { keyHash: RETIRED_HASH })).toBe(false);
  });

  it("is rejected by the account lookup", async () => {
    await writeStore({
      accounts: [{ key: RETIRED_DEFAULT, email: "demo@trustifysmm.com", balance: 100, currency: "USD" }],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    });
    const { getAccountByKey } = await import("@/lib/smm-api/demo-store");
    expect(await getAccountByKey(RETIRED_DEFAULT)).toBeNull();
  });

  it("is quarantined (revoked, plaintext removed) when the store loads", async () => {
    await writeStore({
      accounts: [
        { key: RETIRED_DEFAULT, email: "demo@trustifysmm.com", balance: 100, currency: "USD" },
        { key: "tsm_livecustomerkey0000000000000000000000", email: "real@example.test", balance: 12, currency: "USD" },
      ],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    });
    const { getAccountByKey } = await import("@/lib/smm-api/demo-store");
    await getAccountByKey("tsm_livecustomerkey0000000000000000000000");

    const store = await readStore();
    const demo = store.accounts.find((a: { email: string }) => a.email === "demo@trustifysmm.com");
    expect(demo.revoked).toBe(true);
    expect(demo.key).toBeUndefined();
    // The unrelated real account is untouched.
    const real = store.accounts.find((a: { email: string }) => a.email === "real@example.test");
    expect(real.revoked).toBeUndefined();
    expect(real.balance).toBe(12);
  });
});

describe("demo key configuration fails closed", () => {
  it("returns null when DEMO_API_KEY is unset", () => {
    expect(demoKeyFromEnv()).toBeNull();
  });

  it("returns null when DEMO_API_KEY is blank", () => {
    process.env.DEMO_API_KEY = "   ";
    expect(demoKeyFromEnv()).toBeNull();
  });

  it("returns null when DEMO_API_KEY is too short", () => {
    process.env.DEMO_API_KEY = "short-demo-key";
    expect(demoKeyFromEnv()).toBeNull();
  });

  it("returns null when DEMO_API_KEY is the retired default", () => {
    process.env.DEMO_API_KEY = RETIRED_DEFAULT;
    expect(demoKeyFromEnv()).toBeNull();
  });

  it("accepts a strong configured key", () => {
    const { key } = generateApiKey();
    process.env.DEMO_API_KEY = key;
    expect(demoKeyFromEnv()).toBe(key);
  });

  it("seeds no usable credential when the env var is absent", async () => {
    const { saveInvoice, getAccountByKey } = await import("@/lib/smm-api/demo-store");
    // Force store creation with no DEMO_API_KEY set.
    await saveInvoice({
      id: "TSM-SEED0001",
      apiKey: "unused",
      amountUsd: 1,
      status: "pending",
      provider: "demo",
      createdAt: new Date().toISOString(),
      walletCredited: false,
    });
    const store = await readStore();
    const demo = store.accounts.find((a: { email: string }) => a.email === "demo@trustifysmm.com");
    expect(demo.key).toBeUndefined();
    expect(demo.keyHash).toBeUndefined();
    expect(await getAccountByKey(RETIRED_DEFAULT)).toBeNull();
    expect(await getAccountByKey("")).toBeNull();
  });

  it("seeds only a hash when a strong env var is provided", async () => {
    const { key } = generateApiKey();
    process.env.DEMO_API_KEY = key;
    vi.resetModules();
    const { saveInvoice, getAccountByKey } = await import("@/lib/smm-api/demo-store");
    await saveInvoice({
      id: "TSM-SEED0002",
      apiKey: "unused",
      amountUsd: 1,
      status: "pending",
      provider: "demo",
      createdAt: new Date().toISOString(),
      walletCredited: false,
    });
    const store = await readStore();
    const demo = store.accounts.find((a: { email: string }) => a.email === "demo@trustifysmm.com");
    expect(demo.key).toBeUndefined();
    expect(demo.keyHash).toBe(hashApiKey(key));
    expect(await getAccountByKey(key)).not.toBeNull();
  });
});

describe("hashed key matching", () => {
  it("generates prefixed, high-entropy keys with unique values", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key.startsWith("tsm_")).toBe(true);
    expect(a.key.length).toBeGreaterThanOrEqual(50);
    expect(a.key).not.toBe(b.key);
    expect(a.keyHash).toHaveLength(64);
  });

  it("matches a correct key and rejects wrong ones", () => {
    const { key, keyHash } = generateApiKey();
    expect(keyMatchesRecord(key, { keyHash })).toBe(true);
    expect(keyMatchesRecord(`${key}x`, { keyHash })).toBe(false);
    expect(keyMatchesRecord("", { keyHash })).toBe(false);
    expect(keyMatchesRecord(null, { keyHash })).toBe(false);
    expect(keyMatchesRecord(key, {})).toBe(false);
  });

  it("never persists the plaintext key on a new demo account", async () => {
    const { key } = generateApiKey();
    process.env.DEMO_API_KEY = key;
    vi.resetModules();
    const { saveInvoice } = await import("@/lib/smm-api/demo-store");
    await saveInvoice({
      id: "TSM-SEED0003",
      apiKey: "unused",
      amountUsd: 1,
      status: "pending",
      provider: "demo",
      createdAt: new Date().toISOString(),
      walletCredited: false,
    });
    const raw = await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8");
    expect(raw).not.toContain(key);
  });
});

describe("demo account cannot touch real money", () => {
  function fixture() {
    return {
      accounts: [
        { key: "tsm_realcustomer000000000000000000000", email: "real@example.test", balance: 25, currency: "USD" },
        { email: "demo@trustifysmm.com", balance: 100, currency: "USD", demo: true, revoked: true },
      ],
      orders: [],
      invoices: [
        {
          id: "TSM-DEMO0001",
          apiKey: "tsm_demoaccount0000000000000000000000",
          amountUsd: 50,
          status: "pending",
          provider: "nowpayments",
          createdAt: new Date().toISOString(),
          walletCredited: false,
        },
      ],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    };
  }

  it("refuses a deposit credit addressed to the demo wallet", async () => {
    await writeStore(fixture());
    const { creditWalletDepositLocked } = await import("@/lib/smm-api/demo-store");
    const store = await readStore();
    // Point the demo account's key material at the invoice ref so the credit path resolves it.
    store.accounts[1].key = "tsm_demoaccount0000000000000000000000";
    const result = creditWalletDepositLocked(store, store.invoices[0]);
    expect("error" in result).toBe(true);
    expect(store.accounts[1].balance).toBe(100);
    expect(store.transactions).toHaveLength(0);
  });

  it("still credits a real customer wallet", async () => {
    await writeStore(fixture());
    const { creditWalletDepositLocked } = await import("@/lib/smm-api/demo-store");
    const store = await readStore();
    const invoice = { ...store.invoices[0], apiKey: "tsm_realcustomer000000000000000000000" };
    const result = creditWalletDepositLocked(store, invoice);
    expect(result).toEqual({ ok: true, balance: 75 });
    expect(store.accounts[0].balance).toBe(75);
  });

  it("cannot create a real crypto deposit", async () => {
    const demoKey = "tsm_demoaccount0000000000000000000000";
    await writeStore({
      accounts: [
        { email: "demo@trustifysmm.com", balance: 100, currency: "USD", demo: true, keyHash: hashApiKey(demoKey) },
      ],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    });
    process.env.NOWPAYMENTS_API_KEY = "test-key";
    process.env.NOWPAYMENTS_IPN_SECRET = "test-ipn";
    vi.resetModules();
    const { createBankerInvoice } = await import("@/lib/banker/handler");
    const result = await createBankerInvoice({
      apiKey: demoKey,
      amountUsd: 50,
      requireLive: true,
    });
    expect("error" in result).toBe(true);
    expect(String((result as { error: string }).error)).toMatch(/demo account cannot create/i);
    const store = await readStore();
    expect(store.invoices).toHaveLength(0);
    delete process.env.NOWPAYMENTS_API_KEY;
    delete process.env.NOWPAYMENTS_IPN_SECRET;
  });
});

describe("reseller authentication still works", () => {
  it("authenticates a real customer key through the hashed lookup", async () => {
    const realKey = "tsm_realcustomer000000000000000000000";
    await writeStore({
      accounts: [
        { key: realKey, keyHash: hashApiKey(realKey), email: "real@example.test", balance: 25, currency: "USD" },
      ],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    });
    const { getAccountByKey } = await import("@/lib/smm-api/demo-store");
    const account = await getAccountByKey(realKey);
    expect(account?.email).toBe("real@example.test");
    expect(await getAccountByKey("wrong-key")).toBeNull();
  });

  it("refuses a revoked account at lookup time", async () => {
    const realKey = "tsm_revokedcustomer00000000000000000000";
    await writeStore({
      accounts: [
        { key: realKey, keyHash: hashApiKey(realKey), email: "revoked@example.test", balance: 5, currency: "USD", revoked: true },
      ],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      nextOrderId: 1,
    });
    const { getAccountByKey } = await import("@/lib/smm-api/demo-store");
    expect(await getAccountByKey(realKey)).toBeNull();
  });
});
