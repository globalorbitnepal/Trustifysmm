import { describe, expect, it } from "vitest";
import { creditWalletDepositLocked } from "@/lib/smm-api/demo-store";
import type { BankerInvoice } from "@/lib/smm-api/types";
import { rateLimit } from "@/lib/nowpayments/rate-limit";
import { signNowPaymentsPayload, sortNowPaymentsPayload, verifyNowPaymentsIpnSignature } from "@/lib/nowpayments/signature";
import { mapProviderToInternal, providerStatusCreditsWallet } from "@/lib/nowpayments/status";

describe("NOWPayments IPN signature", () => {
  it("verifies signature over sorted JSON payload", () => {
    const secret = "test-secret";
    const payload = { payment_id: 42, order_id: "TSM-ABC", payment_status: "finished" };
    const signature = signNowPaymentsPayload(payload, secret);
    const raw = JSON.stringify(payload);
    expect(verifyNowPaymentsIpnSignature(raw, signature, secret)).toBe(true);
    expect(verifyNowPaymentsIpnSignature(raw, "deadbeef", secret)).toBe(false);
  });
});

describe("NOWPayments payment status", () => {
  it("maps provider statuses to internal ledger states", () => {
    expect(mapProviderToInternal("finished")).toBe("paid");
    expect(mapProviderToInternal("confirming")).toBe("confirming");
    expect(mapProviderToInternal("partially_paid")).toBe("partial");
    expect(mapProviderToInternal("expired")).toBe("expired");
  });

  it("credits wallet only on finished", () => {
    for (const status of ["waiting", "confirming", "confirmed", "sending", "partially_paid", "failed", "expired", "refunded"]) {
      expect(providerStatusCreditsWallet(status)).toBe(false);
      expect(mapProviderToInternal(status)).not.toBe("paid");
    }
    expect(providerStatusCreditsWallet("finished")).toBe(true);
    expect(mapProviderToInternal("finished")).toBe("paid");
    expect(mapProviderToInternal("failed")).toBe("failed");
    expect(mapProviderToInternal("confirmed")).toBe("confirming");
  });
});

describe("NOWPayments signature edge cases", () => {
  it("sorts nested objects and rejects missing or bad signatures", () => {
    const secret = "fixture-secret";
    const payload = { b: 1, a: { z: 2, y: { m: "finished" } } };
    expect(Object.keys(sortNowPaymentsPayload(payload) as object)).toEqual(["a", "b"]);
    const raw = JSON.stringify(payload);
    const signature = signNowPaymentsPayload(payload, secret);
    expect(verifyNowPaymentsIpnSignature(raw, signature, secret)).toBe(true);
    expect(verifyNowPaymentsIpnSignature(raw, null, secret)).toBe(false);
    expect(verifyNowPaymentsIpnSignature("{", signature, secret)).toBe(false);
    expect(verifyNowPaymentsIpnSignature(raw, signature, "")).toBe(false);
  });
});

describe("isolated wallet credit", () => {
  function fixture() {
    const invoice: BankerInvoice = {
      id: "TSM-TESTONLY",
      apiKey: "key-test",
      amountUsd: 25,
      status: "pending",
      provider: "nowpayments",
      createdAt: new Date().toISOString(),
      walletCredited: false,
    };
    const store = {
      accounts: [{ key: "key-test", email: "audit@example.test", balance: 10, currency: "USD" as const }],
      orders: [],
      invoices: [invoice],
      transactions: [] as { ref?: string; type: string }[],
      idempotency: [],
      nextOrderId: 1,
    };
    return { invoice, store };
  }

  it("credits once and ignores a duplicate call", () => {
    const { invoice, store } = fixture();
    const first = creditWalletDepositLocked(store as never, invoice);
    const second = creditWalletDepositLocked(store as never, invoice);
    expect(first).toEqual({ ok: true, balance: 35 });
    expect(second).toEqual({ ok: true, balance: 35 });
    expect(store.transactions.filter((row) => row.ref === invoice.id && row.type === "deposit")).toHaveLength(1);
    expect(store.accounts[0].balance).toBe(35);
  });

  it("does not credit a second user or a missing wallet", () => {
    const { invoice, store } = fixture();
    invoice.apiKey = "missing";
    expect(creditWalletDepositLocked(store as never, invoice)).toEqual({ error: "Account not found" });
    expect(store.accounts[0].balance).toBe(10);
  });
});

describe("deposit create rate limit", () => {
  it("blocks after the configured window limit", () => {
    const key = `audit-${Date.now()}`;
    for (let i = 0; i < 3; i += 1) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(false);
  });
});