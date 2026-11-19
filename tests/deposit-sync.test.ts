import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
const originalFetch = global.fetch;
const originalKey = process.env.NOWPAYMENTS_API_KEY;
const originalIpn = process.env.NOWPAYMENTS_IPN_SECRET;

const OWNER_KEY = "tsm_syncowner0000000000000000000001";
const ISO = "2026-11-18T12:00:00.000Z";
let workDir = "";

function invoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "TSM-SYNC00000001",
    apiKey: OWNER_KEY,
    userId: "usr_owner",
    amountUsd: 10,
    status: "pending",
    provider: "nowpayments",
    createdAt: ISO,
    walletCredited: false,
    payCurrency: "usdtbsc",
    payAmount: "10.18508074",
    baseCrypto: "9.99640806",
    quotedFeeUsd: 0.19,
    nowPaymentId: "4686358846",
    network: "bsc",
    providerStatus: "waiting",
    statusHistory: [],
    ...overrides,
  };
}

function store(invoices: unknown[]) {
  return {
    accounts: [{ key: OWNER_KEY, email: "owner@example.test", balance: 0, currency: "USD" }],
    orders: [],
    invoices,
    transactions: [],
    idempotency: [],
    nextOrderId: 1,
  };
}

function providerFinished(overrides: Record<string, unknown> = {}) {
  return {
    payment_id: 4686358846,
    payment_status: "finished",
    price_amount: 10,
    price_currency: "usd",
    pay_amount: 10.18508074,
    actually_paid: 10.18508074,
    pay_currency: "usdtbsc",
    order_id: "TSM-SYNC00000001",
    network: "bsc",
    ...overrides,
  };
}

function mockProvider(payload: unknown, status = 200) {
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } }),
  ) as unknown as typeof fetch;
}

async function readStore() {
  return JSON.parse(await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8"));
}

async function seed(invoices: unknown[]) {
  await writeFile(
    path.join(workDir, "data", "runtime", "api-store.json"),
    JSON.stringify(store(invoices), null, 1),
    "utf8",
  );
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "tsm-sync-"));
  await mkdir(path.join(workDir, "data", "runtime"), { recursive: true });
  process.env.NOWPAYMENTS_API_KEY = "test-key";
  process.env.NOWPAYMENTS_IPN_SECRET = "test-ipn";
  process.chdir(workDir);
  vi.resetModules();
});

afterEach(async () => {
  process.chdir(originalCwd);
  global.fetch = originalFetch;
  process.env.NOWPAYMENTS_API_KEY = originalKey;
  process.env.NOWPAYMENTS_IPN_SECRET = originalIpn;
  vi.resetModules();
});

describe("checkout poll sync (missed webhook)", () => {
  it("credits when the provider reports finished", async () => {
    await seed([invoice()]);
    mockProvider(providerFinished());
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");

    const after = await readStore();
    expect(after.invoices[0].status).toBe("paid");
    expect(after.invoices[0].walletCredited).toBe(true);
    expect(after.accounts[0].balance).toBe(10);
    expect(after.transactions).toHaveLength(1);
  });

  it("never credits twice when the poll repeats", async () => {
    await seed([invoice()]);
    mockProvider(providerFinished());
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");
    await syncNowPaymentsInvoice("TSM-SYNC00000001");
    await syncNowPaymentsInvoice("TSM-SYNC00000001");

    const after = await readStore();
    expect(after.accounts[0].balance).toBe(10);
    expect(after.transactions).toHaveLength(1);
  });

  it("leaves the wallet alone while the provider still says waiting", async () => {
    await seed([invoice()]);
    mockProvider(providerFinished({ payment_status: "waiting", actually_paid: 0 }));
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");

    const after = await readStore();
    expect(after.accounts[0].balance).toBe(0);
    expect(after.invoices[0].status).toBe("pending");
    expect(after.transactions).toHaveLength(0);
  });

  it("holds an underpayment for review instead of crediting", async () => {
    await seed([invoice()]);
    mockProvider(providerFinished({ actually_paid: 5 }));
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");

    const after = await readStore();
    expect(after.invoices[0].status).toBe("review");
    expect(after.invoices[0].reviewReason).toBe("underpaid");
    expect(after.accounts[0].balance).toBe(0);
  });

  it("throttles repeat provider calls inside the cooldown", async () => {
    await seed([invoice()]);
    const spy = vi.fn(async () =>
      new Response(JSON.stringify(providerFinished({ payment_status: "waiting", actually_paid: 0 })), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = spy as unknown as typeof fetch;
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");
    await syncNowPaymentsInvoice("TSM-SYNC00000001");

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not call the provider once the deposit is paid", async () => {
    await seed([invoice({ status: "paid", walletCredited: true })]);
    const spy = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = spy as unknown as typeof fetch;
    const { syncNowPaymentsInvoice } = await import("@/lib/banker/handler");

    await syncNowPaymentsInvoice("TSM-SYNC00000001");
    expect(spy).not.toHaveBeenCalled();
  });
});
