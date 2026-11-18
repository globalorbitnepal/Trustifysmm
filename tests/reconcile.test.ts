import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
const originalFetch = global.fetch;
const originalKey = process.env.NOWPAYMENTS_API_KEY;
const originalIpn = process.env.NOWPAYMENTS_IPN_SECRET;

const OWNER_KEY = "tsm_reconcileowner000000000000000001";
const ADMIN = "orbit-superadmin";
let workDir = "";

const ISO = "2026-11-18T12:00:00.000Z";

function baseInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "TSM-RECON000001",
    apiKey: OWNER_KEY,
    userId: "usr_owner",
    amountUsd: 25,
    status: "pending",
    provider: "nowpayments",
    createdAt: ISO,
    walletCredited: false,
    payCurrency: "usdttrc20",
    payAmount: "25.0",
    actuallyPaidAmount: "0",
    nowPaymentId: "1000000001",
    network: "trx",
    address: "TTestOnlyAddress000000000000000000",
    providerStatus: "waiting",
    statusHistory: [],
    ...overrides,
  };
}

function storeWith(invoices: unknown[]) {
  return {
    accounts: [{ key: OWNER_KEY, email: "owner@example.test", balance: 10, currency: "USD" }],
    orders: [],
    invoices,
    transactions: [],
    idempotency: [],
    nextOrderId: 1,
  };
}

async function readStore() {
  return JSON.parse(await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8"));
}

/** Mock the provider's GET /v1/payment/:id response. */
function mockProvider(payload: unknown, status = 200) {
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } }),
  ) as unknown as typeof fetch;
}

function providerFinished(overrides: Record<string, unknown> = {}) {
  return {
    payment_id: 1000000001,
    payment_status: "finished",
    pay_address: "TTestOnlyAddress000000000000000000",
    price_amount: 25,
    price_currency: "usd",
    pay_amount: 25.0,
    actually_paid: 25.0,
    pay_currency: "usdttrc20",
    order_id: "TSM-RECON000001",
    network: "trx",
    ...overrides,
  };
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "tsm-recon-"));
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

async function seed(invoices: unknown[]) {
  await writeFile(
    path.join(workDir, "data", "runtime", "api-store.json"),
    JSON.stringify(storeWith(invoices), null, 1),
    "utf8",
  );
}

async function load() {
  return import("@/lib/banker/handler");
}

describe("reconciliation: missed IPN + finished payment", () => {
  it("credits a finished provider payment that never received an IPN", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished());
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(result.ok).toBe(true);
    expect(result.outcome).toBe("credited");
    expect(result.providerStatus).toBe("finished");

    const store = await readStore();
    const invoice = store.invoices[0];
    expect(invoice.status).toBe("paid");
    expect(invoice.walletCredited).toBe(true);
    expect(store.accounts[0].balance).toBe(35); // 10 + 25
    expect(store.transactions).toHaveLength(1);
    expect(store.transactions[0].type).toBe("deposit");
    expect(store.transactions[0].ref).toBe("TSM-RECON000001");
  });

  it("records admin identity, provider status and result", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished());
    const { reconcileNowPaymentsDeposit } = await load();
    await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    const invoice = (await readStore()).invoices[0];
    expect(invoice.reconciledBy).toBe(ADMIN);
    expect(invoice.reconcileResult).toBe("credited");
    expect(invoice.reconcileProviderStatus).toBe("finished");
    expect(invoice.reconciledAt).toBeTruthy();
    expect(invoice.reconcileHistory).toHaveLength(1);
    expect(invoice.reconcileHistory[0].adminId).toBe(ADMIN);
    expect(invoice.reconcileHistory[0].result).toBe("credited");
    expect(invoice.reconcileHistory[0].at).toBeTruthy();
  });
});

describe("reconciliation: no credit for non-finished states", () => {
  it("does not credit a waiting payment", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ payment_status: "waiting", actually_paid: 0 }));
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.ok).toBe(true);
    expect(result.outcome).toBe("no_credit");

    const store = await readStore();
    expect(store.accounts[0].balance).toBe(10);
    expect(store.transactions).toHaveLength(0);
    expect(store.invoices[0].walletCredited).toBe(false);
  });

  it("does not credit a confirming payment", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ payment_status: "confirming" }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("no_credit");
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("does not credit a failed payment and marks it failed", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ payment_status: "failed" }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("no_credit");

    const store = await readStore();
    expect(store.invoices[0].status).toBe("failed");
    expect(store.accounts[0].balance).toBe(10);
  });

  it("does not credit an expired payment", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ payment_status: "expired" }));
    const { reconcileNowPaymentsDeposit } = await load();
    await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    const store = await readStore();
    expect(store.invoices[0].status).toBe("expired");
    expect(store.accounts[0].balance).toBe(10);
  });
});

describe("reconciliation: identity and amount verification", () => {
  it("reviews a mismatched provider payment id", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ payment_id: 9999999999 }));
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("review");
    expect(result.message).toMatch(/different payment id/i);

    const store = await readStore();
    expect(store.accounts[0].balance).toBe(10);
    expect(store.transactions).toHaveLength(0);
  });

  it("reviews a wrong currency", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ pay_currency: "btc" }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(result.outcome).toBe("review");
    expect(result.message).toMatch(/pay currency mismatch/i);
    const store = await readStore();
    expect(store.invoices[0].status).toBe("review");
    expect(store.accounts[0].balance).toBe(10);
  });

  it("reviews a wrong network", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ network: "eth" }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(result.outcome).toBe("review");
    expect(result.message).toMatch(/network mismatch/i);
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("reviews an underpayment", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ actually_paid: 12.5 }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(result.outcome).toBe("review");
    expect(result.message).toMatch(/underpaid/i);
    const store = await readStore();
    expect(store.accounts[0].balance).toBe(10);
    expect(store.transactions).toHaveLength(0);
  });

  it("reviews a USD amount mismatch", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ price_amount: 250 }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("review");
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("reviews an incomplete payload with no paid amount", async () => {
    await seed([baseInvoice()]);
    mockProvider({ payment_id: 1000000001, payment_status: "finished", price_amount: 25, price_currency: "usd", pay_currency: "usdttrc20" });
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("review");
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("refuses an unknown deposit without calling the provider", async () => {
    await seed([]);
    const spy = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = spy as unknown as typeof fetch;
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-NOPE", adminId: ADMIN });
    expect(result.ok).toBe(false);
    expect(result.outcome).toBe("unknown_deposit");
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a deposit with no provider payment id", async () => {
    await seed([baseInvoice({ nowPaymentId: undefined, provider: "demo" })]);
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.ok).toBe(false);
    expect(result.outcome).toBe("not_nowpayments");
  });
});

describe("reconciliation: duplicate protection", () => {
  it("never credits twice on repeated refreshes", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished());
    const { reconcileNowPaymentsDeposit } = await load();

    const first = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    const second = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    const third = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(first.outcome).toBe("credited");
    expect(second.outcome).toBe("already_credited");
    expect(third.outcome).toBe("already_credited");

    const store = await readStore();
    expect(store.accounts[0].balance).toBe(35); // credited exactly once
    expect(store.transactions).toHaveLength(1);
    // Every refresh is audited.
    expect(store.invoices[0].reconcileHistory).toHaveLength(3);
  });

  it("does not call the provider for an already-credited deposit", async () => {
    await seed([baseInvoice({ status: "paid", walletCredited: true })]);
    const spy = vi.fn(async () => new Response("{}", { status: 200 }));
    global.fetch = spy as unknown as typeof fetch;
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.outcome).toBe("already_credited");
    expect(spy).not.toHaveBeenCalled();
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("keeps a single ledger row when an IPN already credited the deposit", async () => {
    await seed([baseInvoice({ status: "paid", walletCredited: true })]);
    const store = await readStore();
    store.accounts[0].balance = 35;
    store.transactions.push({
      id: "txn_existing",
      accountKey: OWNER_KEY,
      type: "deposit",
      amount: 25,
      balanceAfter: 35,
      description: "Crypto deposit TSM-RECON000001",
      status: "completed",
      createdAt: ISO,
      ref: "TSM-RECON000001",
    });
    await writeFile(path.join(workDir, "data", "runtime", "api-store.json"), JSON.stringify(store, null, 1), "utf8");

    mockProvider(providerFinished());
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });

    expect(result.outcome).toBe("already_credited");
    const after = await readStore();
    expect(after.accounts[0].balance).toBe(35);
    expect(after.transactions).toHaveLength(1);
  });
});

describe("reconciliation: provider availability and trust", () => {
  it("changes nothing when the provider is unreachable", async () => {
    await seed([baseInvoice()]);
    mockProvider({ message: "down" }, 503);
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.ok).toBe(false);
    expect(result.outcome).toBe("provider_unavailable");

    const store = await readStore();
    expect(store.accounts[0].balance).toBe(10);
    expect(store.invoices[0].status).toBe("pending");
    expect(store.transactions).toHaveLength(0);
    expect(store.invoices[0].reconcileHistory[0].result).toBe("error");
  });

  it("ignores a browser-supplied status and uses only the provider response", async () => {
    await seed([baseInvoice()]);
    // Provider says waiting; a malicious caller might claim finished. There is no input for it,
    // and the outcome must follow the provider.
    mockProvider(providerFinished({ payment_status: "waiting", actually_paid: 0 }));
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({
      invoiceId: "TSM-RECON000001",
      adminId: ADMIN,
      // @ts-expect-error deliberately passing a status that must be ignored
      payment_status: "finished",
      status: "finished",
    });
    expect(result.outcome).toBe("no_credit");
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("binds the payload to the local deposit even if the provider echoes another order id", async () => {
    await seed([baseInvoice()]);
    mockProvider(providerFinished({ order_id: "TSM-SOMEONE-ELSE" }));
    const { reconcileNowPaymentsDeposit } = await load();

    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    // The payload is re-bound to the local invoice id, so the credit applies here and only here.
    expect(result.outcome).toBe("credited");
    const store = await readStore();
    expect(store.transactions).toHaveLength(1);
    expect(store.transactions[0].ref).toBe("TSM-RECON000001");
  });
});

describe("reconciliation: does not bypass IPN rules", () => {
  it("still credits only via the shared policy, never for a demo provider", async () => {
    await seed([baseInvoice({ provider: "demo", nowPaymentId: undefined })]);
    const { reconcileNowPaymentsDeposit } = await load();
    const result = await reconcileNowPaymentsDeposit({ invoiceId: "TSM-RECON000001", adminId: ADMIN });
    expect(result.ok).toBe(false);
    expect(result.outcome).toBe("not_nowpayments");
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("markInvoicePaid rejects a NOWPayments invoice from a browser-like source", async () => {
    await seed([baseInvoice()]);
    const { markInvoicePaid } = await load();
    const result = await markInvoicePaid("TSM-RECON000001", { source: "demo" });
    expect("error" in result).toBe(true);
    expect((await readStore()).accounts[0].balance).toBe(10);
  });

  it("markInvoicePaid still credits for the IPN source", async () => {
    await seed([baseInvoice()]);
    const { markInvoicePaid } = await load();
    const result = await markInvoicePaid("TSM-RECON000001", {
      provider: "nowpayments",
      providerStatus: "finished",
      actuallyPaid: "25.0",
      source: "ipn",
    });
    expect("ok" in result).toBe(true);
    expect((await readStore()).accounts[0].balance).toBe(35);
  });
});
