import { randomBytes } from "node:crypto";
import { addBalance, getAccountByKey, getInvoice, saveInvoice, updateInvoice } from "@/lib/smm-api/demo-store";
import type { BankerInvoice } from "@/lib/smm-api/types";
import { addNotification } from "@/lib/customer/panel-store";
import { getUserByApiKey } from "@/lib/customer/user-store";

function siteOrigin() {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3010").replace(/\/$/, "");
}

function newInvoiceId() {
  return `TSM-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function configuredPayCurrencies() {
  const live = Boolean(process.env.NOWPAYMENTS_API_KEY?.trim() && process.env.NOWPAYMENTS_IPN_SECRET?.trim());
  const raw = process.env.BANKER_PAY_CURRENCIES || process.env.BANKER_PAY_CURRENCY || "";
  const currencies = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return { live, currencies: live ? (currencies.length ? currencies : ["usdttrc20"]) : [] };
}

export async function createBankerInvoice(input: {
  apiKey: string;
  amountUsd: number;
  payCurrency?: string;
  requireLive?: boolean;
}) {
  const amount = Math.round(input.amountUsd * 100) / 100;
  if (!Number.isFinite(amount) || amount < 1) {
    return { error: "Minimum top-up is $1.00 USD" } as const;
  }
  if (amount > 50000) {
    return { error: "Maximum single top-up is $50,000 USD" } as const;
  }

  const account = await getAccountByKey(input.apiKey);
  if (!account) return { error: "Invalid API key" } as const;

  const allowed = configuredPayCurrencies();
  const payCurrency = (input.payCurrency || allowed.currencies[0] || "usdttrc20").toLowerCase();
  if (input.requireLive) {
    if (!allowed.live) return { error: "Crypto payments are not configured yet." } as const;
    if (!allowed.currencies.includes(payCurrency)) return { error: "That coin is not enabled." } as const;
  }

  const id = newInvoiceId();
  const now = new Date().toISOString();
  let invoice: BankerInvoice = {
    id,
    apiKey: input.apiKey,
    amountUsd: amount,
    status: "pending",
    provider: "demo",
    createdAt: now,
  };

  const npKey = process.env.NOWPAYMENTS_API_KEY?.trim();
  if (npKey) {
    try {
      const ipnUrl = `${siteOrigin()}/api/banker/webhook`;
      const res = await fetch("https://api.nowpayments.io/v1/payment", {
        method: "POST",
        headers: {
          "x-api-key": npKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          pay_currency: payCurrency,
          ipn_callback_url: ipnUrl,
          order_id: id,
          order_description: `TrustifySMM balance top-up for ${account.email}`,
        }),
      });
      const data = (await res.json()) as {
        payment_id?: number;
        pay_address?: string;
        pay_amount?: number;
        payment_status?: string;
        invoice_url?: string;
      };
      if (res.ok && data.payment_id) {
        invoice = {
          ...invoice,
          provider: "nowpayments",
          payUrl: data.invoice_url,
          address: data.pay_address,
          payCurrency,
          payAmount: data.pay_amount != null ? String(data.pay_amount) : undefined,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
      }
    } catch {
      /* fall back to demo pay link */
    }
  }

  if (input.requireLive && invoice.provider !== "nowpayments") {
    return { error: "The payment gateway did not return a deposit address. Try again shortly." } as const;
  }

  if (!invoice.payUrl && !invoice.address && !input.requireLive) {
    invoice.payUrl = `${siteOrigin()}/api/banker/pay?id=${encodeURIComponent(id)}`;
  }

  await saveInvoice(invoice);

  return {
    invoice_id: invoice.id,
    amount: invoice.amountUsd.toFixed(2),
    currency: "USD",
    status: invoice.status,
    payment_url: invoice.payUrl ?? null,
    pay_address: invoice.address ?? null,
    pay_currency: invoice.payCurrency ?? null,
    pay_amount: invoice.payAmount ?? null,
    expires_at: invoice.expiresAt ?? null,
    provider: invoice.provider,
    message: "Send payment, then balance credits automatically after webhook confirmation.",
  };
}

export async function submitInvoiceHash(invoiceId: string, apiKey: string, txHash: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice || invoice.apiKey !== apiKey) return { error: "Invoice not found" as const };
  if (invoice.status === "paid") return { error: "This deposit is already credited." as const };
  if (invoice.status === "expired" || invoice.status === "failed") {
    return { error: "This deposit can no longer be updated." as const };
  }
  if (!/^[A-Za-z0-9]{16,140}$/.test(txHash)) {
    return { error: "Enter the transaction hash from your wallet. A hash does not credit the wallet by itself." } as const;
  }
  await updateInvoice(invoiceId, { txHash, status: "confirming" });
  return { ok: true as const, status: "confirming" as const };
}

export async function markInvoicePaid(invoiceId: string, meta?: { provider?: string }) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { error: "Invoice not found" as const };
  if (invoice.status === "paid") {
    return { ok: true, balance_added: 0, invoice_id: invoice.id };
  }

  await updateInvoice(invoiceId, {
    status: "paid",
    paidAt: new Date().toISOString(),
    provider: meta?.provider === "nowpayments" ? "nowpayments" : invoice.provider,
  });

  const account = await addBalance(invoice.apiKey, invoice.amountUsd, {
    type: "deposit",
    description: `Crypto deposit ${invoice.id}`,
    ref: invoice.id,
  });
  if (!account) return { error: "Account not found" as const };

  const owner = await getUserByApiKey(invoice.apiKey);
  if (owner) {
    await addNotification({
      userId: owner.id,
      type: "payment_confirmed",
      title: "Deposit credited",
      body: `$${invoice.amountUsd.toFixed(2)} was added to your wallet.`,
      href: "/dashboard/payments",
    });
  }

  return {
    ok: true,
    invoice_id: invoice.id,
    balance_added: invoice.amountUsd,
    new_balance: account.balance,
  };
}

export async function getBankerInvoiceStatus(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { error: "Invoice not found" };
  return {
    invoice_id: invoice.id,
    amount: invoice.amountUsd.toFixed(2),
    currency: "USD",
    status: invoice.status,
    payment_url: invoice.payUrl,
    pay_address: invoice.address ?? null,
    created_at: invoice.createdAt,
    paid_at: invoice.paidAt ?? null,
    pay_currency: invoice.payCurrency ?? null,
    pay_amount: invoice.payAmount ?? null,
    expires_at: invoice.expiresAt ?? null,
    tx_hash: invoice.txHash ?? null,
  };
}