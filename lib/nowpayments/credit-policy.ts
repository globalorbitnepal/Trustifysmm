import type { BankerInvoice } from "@/lib/smm-api/types";
import { compareDecimal, decimalToScaled, scaledToDecimal } from "@/lib/nowpayments/money";
import { providerStatusCreditsWallet } from "@/lib/nowpayments/status";

const CRYPTO_SCALE = 18;
const USD_SCALE = 2;

export type CreditDecision =
  | { action: "credit"; creditUsd: string; overpaidCrypto?: string; verifiedFiatUsd?: string; note: string }
  | { action: "review"; reason: string }
  | { action: "skip"; reason: string };

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * NOWPayments IPN policy.
 * Fiat sufficiency uses the provider field `actually_paid_at_fiat` when it is a positive number.
 * Crypto sufficiency uses `actually_paid` against the quoted `pay_amount`.
 * This file does not convert crypto to USD with a local rate.
 * Credit amount is never higher than the original USD invoice.
 */
export function evaluateNowPaymentsCredit(invoice: BankerInvoice, payload: Record<string, unknown>): CreditDecision {
  const providerStatus = text(payload.payment_status || payload.status);
  if (!providerStatusCreditsWallet(providerStatus)) {
    return { action: "skip", reason: "provider_status_not_finished" };
  }

  const orderId = text(payload.order_id);
  const paymentId = text(payload.payment_id);
  if (orderId && orderId !== invoice.id) {
    return { action: "review", reason: "order_id_mismatch" };
  }
  if (!orderId && !(paymentId && invoice.nowPaymentId === paymentId)) {
    return { action: "review", reason: "payment_identity_missing" };
  }
  if (invoice.nowPaymentId && paymentId && invoice.nowPaymentId !== paymentId) {
    return { action: "review", reason: "payment_id_mismatch" };
  }
  if (!invoice.apiKey) {
    return { action: "review", reason: "customer_missing" };
  }

  const priceCurrency = text(payload.price_currency).toLowerCase();
  if (priceCurrency !== "usd") {
    return { action: "review", reason: "price_currency_mismatch" };
  }
  const priceCompare = compareDecimal(text(payload.price_amount), invoice.amountUsd, USD_SCALE);
  if (priceCompare === null) {
    return { action: "review", reason: "price_amount_invalid" };
  }
  if (priceCompare !== 0) {
    return { action: "review", reason: "usd_amount_mismatch" };
  }

  const payCurrency = text(payload.pay_currency).toLowerCase();
  const expectedCurrency = (invoice.payCurrency || "").toLowerCase();
  if (!payCurrency || !expectedCurrency || payCurrency !== expectedCurrency) {
    return { action: "review", reason: "pay_currency_mismatch" };
  }

  const payloadNetwork = text(payload.network).toLowerCase();
  const invoiceNetwork = (invoice.network || "").toLowerCase();
  if (payloadNetwork && invoiceNetwork && payloadNetwork !== invoiceNetwork) {
    return { action: "review", reason: "network_mismatch" };
  }

  const quoted = text(payload.pay_amount) || invoice.payAmount || "";
  if (invoice.payAmount && text(payload.pay_amount) && compareDecimal(text(payload.pay_amount), invoice.payAmount, CRYPTO_SCALE) !== 0) {
    return { action: "review", reason: "quoted_pay_amount_mismatch" };
  }
  const actuallyPaid = text(payload.actually_paid);
  if (!quoted || !actuallyPaid) {
    return { action: "review", reason: "paid_amount_missing" };
  }
  const paidCompare = compareDecimal(actuallyPaid, quoted, CRYPTO_SCALE);
  if (paidCompare === null) {
    return { action: "review", reason: "paid_amount_invalid" };
  }
  if (paidCompare < 0) {
    return { action: "review", reason: "underpaid" };
  }

  const fiatRaw = text(payload.actually_paid_at_fiat);
  let verifiedFiatUsd: string | undefined;
  if (fiatRaw && compareDecimal(fiatRaw, 0, USD_SCALE) === 1) {
    const fiatCompare = compareDecimal(fiatRaw, invoice.amountUsd, USD_SCALE);
    if (fiatCompare === null) {
      return { action: "review", reason: "fiat_equivalent_invalid" };
    }
    if (fiatCompare < 0) {
      return { action: "review", reason: "fiat_equivalent_insufficient" };
    }
    verifiedFiatUsd = fiatRaw;
  }

  let overpaidCrypto: string | undefined;
  if (paidCompare > 0) {
    const paid = decimalToScaled(actuallyPaid, CRYPTO_SCALE);
    const quote = decimalToScaled(quoted, CRYPTO_SCALE);
    if (paid === null || quote === null) {
      return { action: "review", reason: "overpay_difference_invalid" };
    }
    overpaidCrypto = scaledToDecimal(paid - quote, CRYPTO_SCALE);
  }

  return {
    action: "credit",
    creditUsd: scaledToDecimal(decimalToScaled(invoice.amountUsd, USD_SCALE) ?? BigInt(0), USD_SCALE),
    overpaidCrypto,
    verifiedFiatUsd,
    note: overpaidCrypto
      ? "Finished payment met the quoted amount. Extra crypto is recorded and is not credited as additional USD."
      : "Finished payment matched the quoted crypto amount and USD invoice.",
  };
}

export const MANUAL_ADJUSTMENT_ACTOR = "orbit-superadmin";

export function planManualAdjustment(input: {
  amountUsd: string;
  reason?: string;
  confirm?: boolean;
  idempotencyKey?: string;
  existingRefs: string[];
}): { ok: true; amount: string; ref: string; description: string } | { error: string } {
  const reason = input.reason?.trim() ?? "";
  if (!input.confirm) return { error: "Confirmation is required." };
  if (reason.length < 8) return { error: "A manual adjustment reason is required." };
  const key = input.idempotencyKey?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(key)) return { error: "A unique adjustment reference is required." };
  const scaled = decimalToScaled(input.amountUsd, USD_SCALE);
  if (scaled === null || scaled === BigInt(0)) return { error: "Enter a non-zero USD amount with at most 2 decimals." };
  const ref = `manual:${key}`;
  if (input.existingRefs.includes(ref)) return { error: "This adjustment was already recorded." };
  const amount = scaledToDecimal(scaled, USD_SCALE);
  return {
    ok: true,
    amount,
    ref,
    description: `Manual balance adjustment by ${MANUAL_ADJUSTMENT_ACTOR}. Reason: ${reason}`,
  };
}