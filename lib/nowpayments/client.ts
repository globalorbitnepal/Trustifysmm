import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";

export type EstimateResponse = {
  currency_from?: string;
  amount_from?: number;
  currency_to?: string;
  estimated_amount?: string | number;
};

export type MinAmountResponse = {
  currency_from?: string;
  currency_to?: string;
  min_amount?: string | number;
  fiat_equivalent?: string | number;
};

export type NowPaymentCreateResponse = {
  payment_id?: number;
  payment_status?: string;
  pay_address?: string;
  pay_amount?: number | string;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
  order_id?: string;
  invoice_id?: string;
  invoice_url?: string;
  expiration_estimate_date?: string;
  network?: string;
  message?: string;
};

async function npFetch<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const cfg = loadNowPaymentsConfig();
  if (!cfg.apiKey) {
    return { ok: false, status: 503, data: { message: "Gateway not configured" } as T };
  }
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      "x-api-key": cfg.apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function createNowPayment(input: {
  priceAmountUsd: number;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
}) {
  return npFetch<NowPaymentCreateResponse>("/v1/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: input.priceAmountUsd,
      price_currency: "usd",
      pay_currency: input.payCurrency,
      ipn_callback_url: input.ipnCallbackUrl,
      order_id: input.orderId,
      order_description: input.orderDescription,
      /*
       * Customer pays the provider service fee. NOWPayments requires fixed rate for this,
       * and the returned pay_amount is the exact crypto the customer must send.
       */
      is_fixed_rate: true,
      is_fee_paid_by_user: true,
    }),
  });
}

export async function getNowPaymentStatus(paymentId: string | number) {
  return npFetch<NowPaymentCreateResponse>(`/v1/payment/${paymentId}`);
}

export async function listNowPaymentCurrencies() {
  return npFetch<{ currencies?: string[] }>("/v1/currencies");
}

export function estimateQuery(amountUsd: number, payCurrency: string, includeCustomerFee: boolean) {
  const query = new URLSearchParams({
    amount: String(amountUsd),
    currency_from: "usd",
    currency_to: payCurrency,
  });
  if (includeCustomerFee) {
    query.set("is_fixed_rate", "true");
    query.set("is_fee_paid_by_user", "true");
  }
  return query;
}

export async function estimateNowPayment(amountUsd: number, payCurrency: string, includeCustomerFee = false) {
  const query = estimateQuery(amountUsd, payCurrency, includeCustomerFee);
  return npFetch<EstimateResponse>(`/v1/estimate?${query.toString()}`);
}

/**
 * Fee-inclusive quote plus the plain quote. A second pass runs only when the
 * provider omits one side or the two prices land in the wrong order.
 */
export async function quoteCustomerFee(amountUsd: number, payCurrency: string) {
  let last: {
    gross: string | null;
    base: string | null;
    fee: ReturnType<typeof feeFromQuotes>;
  } = { gross: null, base: null, fee: null };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const gross = await estimateNowPayment(amountUsd, payCurrency, true);
    const base = await estimateNowPayment(amountUsd, payCurrency, false);
    const grossAmount = gross.ok && gross.data.estimated_amount != null ? String(gross.data.estimated_amount) : null;
    const baseAmount = base.ok && base.data.estimated_amount != null ? String(base.data.estimated_amount) : null;
    const fee = grossAmount && baseAmount ? feeFromQuotes(amountUsd, baseAmount, grossAmount) : null;
    last = { gross: grossAmount, base: baseAmount, fee };
    if (fee && grossAmount) return last;
    await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
  }
  return last;
}

/**
 * Fee the customer pays, taken only from two provider quotes.
 * `gross` is the crypto they must send (fee included). `base` is the quote without that fee.
 * We do not add a markup.
 */
export function feeFromQuotes(amountUsd: number, baseCrypto: string | number, grossCrypto: string | number) {
  const base = Number(baseCrypto);
  const gross = Number(grossCrypto);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || !Number.isFinite(base) || !Number.isFinite(gross) || base <= 0 || gross <= 0) {
    return null;
  }
  const feeCrypto = gross - base;
  if (feeCrypto < -1e-12) return null;
  const feeUsd = Math.round(amountUsd * (gross / base - 1) * 100) / 100;
  return { feeCrypto: Math.max(0, feeCrypto), feeUsd: Math.max(0, feeUsd), payCrypto: gross };
}

export function providerMinUsd(data: MinAmountResponse): number | null {
  const n = Number(data.fiat_equivalent ?? data.min_amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.ceil(n * 100 - 1e-6) / 100;
}

/** Minimum USD for the coin the customer sends, with the customer paying the provider fee. */
export function minAmountQuery(payCurrency: string) {
  return new URLSearchParams({
    currency_from: payCurrency,
    currency_to: "usd",
    fiat_equivalent: "usd",
    is_fixed_rate: "true",
    is_fee_paid_by_user: "true",
  });
}

export async function minNowPaymentAmount(payCurrency: string) {
  return npFetch<MinAmountResponse>(`/v1/min-amount?${minAmountQuery(payCurrency).toString()}`);
}