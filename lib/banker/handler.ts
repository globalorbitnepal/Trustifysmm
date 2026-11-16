import { randomBytes } from "node:crypto";
import { addBalance, getAccountByKey, getInvoice, saveInvoice, updateInvoice } from "@/lib/smm-api/demo-store";
import type { BankerInvoice } from "@/lib/smm-api/types";

function siteOrigin() {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3010").replace(/\/$/, "");
}

function newInvoiceId() {
  return `TSM-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function createBankerInvoice(input: { apiKey: string; amountUsd: number }) {
  const amount = Math.round(input.amountUsd * 100) / 100;
  if (!Number.isFinite(amount) || amount < 1) {
    return { error: "Minimum top-up is $1.00 USD" } as const;
  }
  if (amount > 50000) {
    return { error: "Maximum single top-up is $50,000 USD" } as const;
  }

  const account = await getAccountByKey(input.apiKey);
  if (!account) return { error: "Invalid API key" } as const;

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
          pay_currency: process.env.BANKER_PAY_CURRENCY || "usdttrc20",
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
        };
      }
    } catch {
      /* fall back to demo pay link */
    }
  }

  if (!invoice.payUrl && !invoice.address) {
    invoice.payUrl = `${siteOrigin()}/api/banker/pay?id=${encodeURIComponent(id)}`;
  }

  await saveInvoice(invoice);

  return {
    invoice_id: invoice.id,
    amount: invoice.amountUsd.toFixed(2),
    currency: "USD",
    status: invoice.status,
    payment_url: invoice.payUrl,
    pay_address: invoice.address ?? null,
    provider: invoice.provider,
    message: "Send payment, then balance credits automatically after webhook confirmation.",
  };
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

  const account = await addBalance(invoice.apiKey, invoice.amountUsd);
  if (!account) return { error: "Account not found" as const };

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
  };
}