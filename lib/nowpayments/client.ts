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
    }),
  });
}

export async function getNowPaymentStatus(paymentId: string | number) {
  return npFetch<NowPaymentCreateResponse>(`/v1/payment/${paymentId}`);
}

export async function listNowPaymentCurrencies() {
  return npFetch<{ currencies?: string[] }>("/v1/currencies");
}

export async function estimateNowPayment(amountUsd: number, payCurrency: string) {
  const query = new URLSearchParams({
    amount: String(amountUsd),
    currency_from: "usd",
    currency_to: payCurrency,
  });
  return npFetch<EstimateResponse>(`/v1/estimate?${query.toString()}`);
}

export async function minNowPaymentAmount(payCurrency: string) {
  const query = new URLSearchParams({
    currency_from: "usd",
    currency_to: payCurrency,
    fiat_equivalent: "usd",
  });
  return npFetch<MinAmountResponse>(`/v1/min-amount?${query.toString()}`);
}