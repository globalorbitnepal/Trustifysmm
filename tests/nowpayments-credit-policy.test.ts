import { describe, expect, it } from "vitest";
import type { BankerInvoice } from "@/lib/smm-api/types";
import { evaluateNowPaymentsCredit, planManualAdjustment } from "@/lib/nowpayments/credit-policy";

function invoice(patch: Partial<BankerInvoice> = {}): BankerInvoice {
  return {
    id: "TSM-TESTONLY",
    apiKey: "customer-key",
    amountUsd: 25,
    status: "pending",
    provider: "nowpayments",
    createdAt: "2026-11-18T00:00:00.000Z",
    payCurrency: "usdttrc20",
    payAmount: "25.00",
    nowPaymentId: "9001",
    network: "trx",
    walletCredited: false,
    ...patch,
  };
}

function finished(patch: Record<string, unknown> = {}) {
  return {
    payment_id: "9001",
    order_id: "TSM-TESTONLY",
    payment_status: "finished",
    price_amount: "25.00",
    price_currency: "usd",
    pay_amount: "25.00",
    actually_paid: "25.00",
    pay_currency: "usdttrc20",
    network: "trx",
    actually_paid_at_fiat: "25.00",
    ...patch,
  };
}

describe("NOWPayments credit policy", () => {
  it("credits the original USD amount for an exact finished payment", () => {
    const decision = evaluateNowPaymentsCredit(invoice(), finished());
    expect(decision.action).toBe("credit");
    if (decision.action === "credit") expect(decision.creditUsd).toBe("25");
  });

  it("holds an underpayment for review", () => {
    const decision = evaluateNowPaymentsCredit(invoice(), finished({ actually_paid: "24.99", actually_paid_at_fiat: "24.99" }));
    expect(decision).toMatchObject({ action: "review", reason: "underpaid" });
  });

  it("records crypto overpayment without increasing the USD credit", () => {
    const decision = evaluateNowPaymentsCredit(invoice(), finished({ actually_paid: "26.50", actually_paid_at_fiat: "26.50" }));
    expect(decision.action).toBe("credit");
    if (decision.action === "credit") {
      expect(decision.creditUsd).toBe("25");
      expect(decision.overpaidCrypto).toBe("1.5");
    }
  });

  it("blocks the wrong cryptocurrency and network", () => {
    expect(evaluateNowPaymentsCredit(invoice(), finished({ pay_currency: "btc" })).action).toBe("review");
    expect(evaluateNowPaymentsCredit(invoice(), finished({ network: "eth" }))).toMatchObject({ reason: "network_mismatch" });
  });

  it("blocks an insufficient provider fiat equivalent", () => {
    expect(evaluateNowPaymentsCredit(invoice(), finished({ actually_paid_at_fiat: "20.00" }))).toMatchObject({
      reason: "fiat_equivalent_insufficient",
    });
  });

  it("blocks a payment identity mismatch", () => {
    expect(evaluateNowPaymentsCredit(invoice(), finished({ payment_id: "1" }))).toMatchObject({ reason: "payment_id_mismatch" });
    expect(evaluateNowPaymentsCredit(invoice(), finished({ order_id: "OTHER" }))).toMatchObject({ reason: "order_id_mismatch" });
  });

  it("does not credit unfinished statuses", () => {
    for (const payment_status of ["waiting", "confirming", "confirmed", "partially_paid", "failed", "expired"]) {
      expect(evaluateNowPaymentsCredit(invoice(), finished({ payment_status })).action).toBe("skip");
    }
  });
});

describe("manual balance adjustment policy", () => {
  it("requires confirmation, a reason, and rejects duplicates", () => {
    expect("error" in planManualAdjustment({ amountUsd: "10.00", reason: "support", confirm: false, idempotencyKey: "adjust001", existingRefs: [] })).toBe(true);
    expect("error" in planManualAdjustment({ amountUsd: "10.00", reason: "short", confirm: true, idempotencyKey: "adjust001", existingRefs: [] })).toBe(true);
    const created = planManualAdjustment({
      amountUsd: "10.50",
      reason: "Goodwill credit after review",
      confirm: true,
      idempotencyKey: "adjust001",
      existingRefs: [],
    });
    expect(created).toMatchObject({ ok: true, ref: "manual:adjust001", amount: "10.5" });
    if (!("ok" in created)) return;
    expect(created.description).toContain("orbit-superadmin");
    expect(created.description).not.toContain("finished");
    expect(
      planManualAdjustment({
        amountUsd: "10.50",
        reason: "Goodwill credit after review",
        confirm: true,
        idempotencyKey: "adjust001",
        existingRefs: [created.ref],
      }),
    ).toMatchObject({ error: "This adjustment was already recorded." });
  });
});