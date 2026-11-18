import { randomBytes } from "node:crypto";
import {
  finalizeDepositCredit,
  getAccountByKey,
  getInvoice,
  getInvoiceByNowPaymentId,
  saveInvoice,
  updateInvoice,
} from "@/lib/smm-api/demo-store";
import type { BankerInvoice, DepositStatusHistory } from "@/lib/smm-api/types";
import { addNotification } from "@/lib/customer/panel-store";
import { getUserByApiKey, syncCustomerBalanceFromWallet } from "@/lib/customer/user-store";
import { createNowPayment, getNowPaymentStatus, minNowPaymentAmount, providerMinUsd } from "@/lib/nowpayments/client";
import { findDepositOption } from "@/lib/nowpayments/currencies";
import { loadNowPaymentsConfig, publicGatewayConfig } from "@/lib/nowpayments/config";
import { evaluateNowPaymentsCredit } from "@/lib/nowpayments/credit-policy";
import { mapProviderToInternal, providerStatusCreditsWallet } from "@/lib/nowpayments/status";
import { createDepositAccessToken, DEPOSIT_TOKEN_HEADER, verifyDepositAccessToken } from "@/lib/banker/access";
import { resellerKeyMatchesInvoiceKey } from "@/lib/banker/api-key";
import { isDemoAccount } from "@/lib/smm-api/demo-store";

function siteOrigin() {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3010").replace(/\/$/, "");
}

function ipnCallbackUrl() {
  return `${siteOrigin()}/api/payments/nowpayments/ipn`;
}

function newInvoiceId() {
  return `TSM-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function pushHistory(invoice: BankerInvoice, status: string, providerStatus?: string): DepositStatusHistory[] {
  const history = [...(invoice.statusHistory ?? [])];
  const last = history[history.length - 1];
  if (last?.status === status && last.providerStatus === providerStatus) return history;
  history.push({ status, providerStatus, at: new Date().toISOString() });
  return history.slice(-40);
}

export function configuredPayCurrencies() {
  const pub = publicGatewayConfig();
  return { live: pub.live, currencies: pub.currencies, minDepositUsd: pub.minDepositUsd, maxDepositUsd: pub.maxDepositUsd };
}

export async function createBankerInvoice(input: {
  apiKey: string;
  userId?: string;
  amountUsd: number;
  payCurrency?: string;
  requireLive?: boolean;
}) {
  const cfg = loadNowPaymentsConfig();
  const amount = Math.round(input.amountUsd * 100) / 100;
  if (!Number.isFinite(amount) || amount < cfg.minDepositUsd) {
    return { error: `Minimum top-up is $${cfg.minDepositUsd.toFixed(2)} USD` } as const;
  }
  if (amount > cfg.maxDepositUsd) {
    return { error: `Maximum single top-up is $${cfg.maxDepositUsd.toLocaleString()} USD` } as const;
  }

  const account = await getAccountByKey(input.apiKey);
  if (!account) return { error: "Invalid API key" } as const;
  /*
   * The seeded demo account is a sandbox wallet. It must never create a real provider invoice,
   * because a provider payment would then be eligible for a wallet credit.
   */
  if (isDemoAccount(account)) {
    return { error: "The demo account cannot create crypto deposits. Use a real account." } as const;
  }

  const allowed = configuredPayCurrencies();
  const payCurrency = (input.payCurrency || allowed.currencies[0] || "usdttrc20").toLowerCase();
  if (input.requireLive) {
    if (!allowed.live) return { error: "Crypto payments are not configured yet." } as const;
    if (!allowed.currencies.includes(payCurrency)) return { error: "That coin is not enabled." } as const;
    const minimum = await minNowPaymentAmount(payCurrency);
    const providerMin = minimum.ok ? providerMinUsd(minimum.data) : null;
    if (providerMin != null && amount + 1e-9 < providerMin) {
      return {
        error: `This coin’s provider minimum is $${providerMin.toFixed(2)} USD. The account minimum is $${cfg.minDepositUsd.toFixed(2)}.`,
      } as const;
    }
  }
  const option = cfg.apiKey ? await findDepositOption(payCurrency) : null;

  const id = newInvoiceId();
  const now = new Date().toISOString();
  const access = createDepositAccessToken();
  let invoice: BankerInvoice = {
    id,
    apiKey: input.apiKey,
    userId: input.userId,
    amountUsd: amount,
    status: "pending",
    provider: "demo",
    createdAt: now,
    walletCredited: false,
    accessTokenHash: access.hash,
    statusHistory: [{ status: "pending", at: now }],
  };

  if (cfg.apiKey) {
    const created = await createNowPayment({
      priceAmountUsd: amount,
      payCurrency,
      orderId: id,
      orderDescription: `TrustifySMM wallet top-up (${account.email})`,
      ipnCallbackUrl: ipnCallbackUrl(),
    });

    const data = created.data;
    if (created.ok && data.payment_id) {
      const expiryMs = cfg.paymentExpiryMinutes * 60 * 1000;
      invoice = {
        ...invoice,
        provider: "nowpayments",
        nowPaymentId: String(data.payment_id),
        providerStatus: data.payment_status ?? "waiting",
        payUrl: data.invoice_url,
        address: data.pay_address,
        payCurrency: data.pay_currency ?? payCurrency,
        payAmount: data.pay_amount != null ? String(data.pay_amount) : undefined,
        network: data.network || option?.network,
        expiresAt: data.expiration_estimate_date ?? new Date(Date.now() + expiryMs).toISOString(),
        statusHistory: pushHistory(invoice, "pending", data.payment_status),
      };
    }
  }

  if (input.requireLive && invoice.provider !== "nowpayments") {
    return { error: "The payment gateway did not return a deposit address. Try again shortly." } as const;
  }

  /*
   * Demo invoices no longer get a payable URL. The old `/api/banker/pay?id=…&confirm=1` link
   * credited a wallet from a GET request, which is gone; that endpoint is now a read-only API
   * that requires the owner's API key, so it is not a browser-linkable payment page.
   * Live deposits always use the provider invoice URL returned above.
   */

  await saveInvoice(invoice);

  const owner = await getUserByApiKey(input.apiKey);
  if (owner) {
    await addNotification({
      userId: owner.id,
      type: "deposit_received",
      title: "Crypto deposit created",
      body: `Invoice ${id} — send ${invoice.payAmount ?? "crypto"} ${invoice.payCurrency?.toUpperCase() ?? ""}`.trim(),
      href: "/dashboard/add-funds",
    });
  }

  return {
    invoice_id: invoice.id,
    deposit_id: invoice.id,
    nowpayments_payment_id: invoice.nowPaymentId ?? null,
    amount: invoice.amountUsd.toFixed(2),
    currency: "USD",
    status: invoice.status,
    provider_status: invoice.providerStatus ?? null,
    payment_url: invoice.payUrl ?? null,
    pay_address: invoice.address ?? null,
    pay_currency: invoice.payCurrency ?? null,
    pay_amount: invoice.payAmount ?? null,
    network: invoice.network ?? null,
    expires_at: invoice.expiresAt ?? null,
    provider: invoice.provider,
    /**
     * Read-only credential for status polling. Returned once here; only its SHA-256 hash is
     * stored. Send it as the `x-deposit-token` header, never in a URL.
     */
    deposit_access_token: access.token,
    token_header: DEPOSIT_TOKEN_HEADER,
    message: "Send payment, then balance credits automatically after verified webhook confirmation.",
  };
}

export async function submitInvoiceHash(invoiceId: string, apiKey: string, txHash: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice || !resellerKeyMatchesInvoiceKey(apiKey, invoice.apiKey)) return { error: "Invoice not found" as const };
  if (invoice.status === "paid") return { error: "This deposit is already credited." as const };
  if (invoice.status === "expired" || invoice.status === "failed") {
    return { error: "This deposit can no longer be updated." } as const;
  }
  if (!/^[A-Za-z0-9]{16,140}$/.test(txHash)) {
    return { error: "Enter the transaction hash from your wallet. A hash does not credit the wallet by itself." } as const;
  }
  await updateInvoice(invoiceId, {
    txHash,
    status: "confirming",
    statusHistory: pushHistory(invoice, "confirming"),
  });
  return { ok: true as const, status: "confirming" as const };
}

export async function markInvoicePaid(
  invoiceId: string,
  meta?: {
    provider?: string;
    providerStatus?: string;
    actuallyPaid?: string;
    /**
     * `ipn` — signed webhook. `reconcile` — Super Admin refresh, where the payload came from a
     * server-side provider API call and passed the identical credit policy. `demo` — demo only.
     * Both `ipn` and `reconcile` are provider-verified; neither is reachable from a browser.
     */
    source?: "ipn" | "reconcile" | "demo";
  },
) {
  const preview = await getInvoice(invoiceId);
  if (!preview) return { error: "Invoice not found" as const };
  if (preview.provider === "nowpayments" && meta?.source !== "ipn" && meta?.source !== "reconcile") {
    return { error: "NOWPayments deposits credit only after a verified finished payment." as const };
  }

  const result = await finalizeDepositCredit(invoiceId, {
    status: "paid",
    paidAt: new Date().toISOString(),
    provider: meta?.provider === "nowpayments" ? "nowpayments" : preview.provider,
    providerStatus: meta?.providerStatus ?? preview.providerStatus ?? "finished",
    walletCredited: true,
    creditedAmountUsd: preview.amountUsd,
    actuallyPaidAmount: meta?.actuallyPaid ?? preview.actuallyPaidAmount,
    statusHistory: pushHistory(preview, "paid", meta?.providerStatus ?? "finished"),
  });

  if ("error" in result) return { error: result.error };
  if (!result.duplicate) {
    await syncCustomerBalanceFromWallet(result.invoice.apiKey);
    const owner = await getUserByApiKey(result.invoice.apiKey);
    if (owner) {
      await addNotification({
        userId: owner.id,
        type: "payment_confirmed",
        title: "Deposit credited",
        body: `$${preview.amountUsd.toFixed(2)} was added to your wallet.`,
        href: "/dashboard/payments",
      });
    }
  }

  return {
    ok: true as const,
    invoice_id: preview.id,
    balance_added: result.duplicate ? 0 : preview.amountUsd,
    new_balance: result.balance,
    duplicate: result.duplicate,
  };
}

export type DepositApplyOutcome =
  | { credited: true; overpaidCrypto: string | null; invoiceId: string; duplicate: boolean }
  | { credited: false; review: true; reason: string; invoiceId: string }
  | { credited: false; status: string; invoiceId: string }
  | { unknown: true; reason: "unknown_deposit" }
  | { error: string };

/**
 * Single source of truth for applying a provider payment payload to a deposit.
 *
 * Used by BOTH the signed IPN webhook and Super Admin reconciliation. The caller is responsible
 * for proving the payload came from the provider (HMAC signature, or a server-side API call);
 * once here, the financial rules are identical and there is no bypass path.
 */
export async function applyNowPaymentsPayload(
  invoice: BankerInvoice,
  payload: Record<string, unknown>,
  options: { source: "ipn" | "reconcile"; audit?: Partial<BankerInvoice> },
): Promise<DepositApplyOutcome> {
  const paymentId = payload.payment_id != null ? String(payload.payment_id) : "";
  const providerStatus = String(payload.payment_status ?? payload.status ?? "");
  const actuallyPaid = payload.actually_paid != null ? String(payload.actually_paid) : undefined;
  const internal = mapProviderToInternal(providerStatus);

  const patch: Partial<BankerInvoice> = {
    providerStatus,
    statusHistory: pushHistory(invoice, internal, providerStatus),
    ...(options.audit ?? {}),
  };
  if (options.source === "ipn") {
    patch.ipnProcessedAt = [...(invoice.ipnProcessedAt ?? []), new Date().toISOString()].slice(-20);
  }

  if (actuallyPaid) patch.actuallyPaidAmount = actuallyPaid;
  if (paymentId && !invoice.nowPaymentId) patch.nowPaymentId = paymentId;
  if (payload.pay_address && typeof payload.pay_address === "string") patch.address = payload.pay_address;
  if (payload.pay_amount != null) patch.payAmount = String(payload.pay_amount);
  if (typeof payload.network === "string" && payload.network.trim()) patch.network = payload.network.trim();

  const decision = evaluateNowPaymentsCredit(invoice, payload);

  if (decision.action === "review") {
    patch.status = "review";
    patch.reviewReason = decision.reason;
    await updateInvoice(invoice.id, patch);
    return { credited: false, review: true, reason: decision.reason, invoiceId: invoice.id };
  }

  if (decision.action === "credit") {
    patch.reviewReason = undefined;
    patch.verifiedFiatUsd = decision.verifiedFiatUsd;
    patch.overpaidCrypto = decision.overpaidCrypto;
    patch.statusHistory = pushHistory(invoice, "paid", providerStatus);
    await updateInvoice(invoice.id, patch);
    const credited = await markInvoicePaid(invoice.id, {
      provider: "nowpayments",
      providerStatus,
      actuallyPaid,
      source: options.source,
    });
    if ("error" in credited && credited.error) return { error: credited.error };
    return {
      credited: true,
      overpaidCrypto: decision.overpaidCrypto ?? null,
      invoiceId: invoice.id,
      duplicate: Boolean(credited.duplicate),
    };
  }

  if (internal === "partial") {
    patch.status = "partial";
  } else if (internal === "failed") {
    patch.status = "failed";
  } else if (internal === "expired") {
    patch.status = "expired";
  } else if (internal === "confirming") {
    patch.status = "confirming";
  } else if (internal !== "paid") {
    patch.status = "pending";
  }

  await updateInvoice(invoice.id, patch);

  if (!providerStatusCreditsWallet(providerStatus)) {
    const owner = await getUserByApiKey(invoice.apiKey);
    if (owner && internal === "failed") {
      await addNotification({
        userId: owner.id,
        type: "payment_failed",
        title: "Deposit failed",
        body: `Invoice ${invoice.id} could not be completed.`,
        href: "/dashboard/payments",
      });
    }
  }

  return { credited: false, status: internal, invoiceId: invoice.id };
}

export async function processNowPaymentsIpnPayload(payload: Record<string, unknown>) {
  const orderId = String(payload.order_id ?? "");
  const paymentId = payload.payment_id != null ? String(payload.payment_id) : "";

  let invoice = orderId ? await getInvoice(orderId) : null;
  if (!invoice && paymentId) invoice = await getInvoiceByNowPaymentId(paymentId);
  if (!invoice) {
    return { ok: true, ignored: true, reason: "unknown_deposit" };
  }

  const outcome = await applyNowPaymentsPayload(invoice, payload, { source: "ipn" });

  if ("error" in outcome) return { ok: false, error: outcome.error };
  if ("unknown" in outcome) return { ok: true, ignored: true, reason: outcome.reason };
  if ("review" in outcome) {
    return { ok: true, updated: true, credited: false, review: true, reason: outcome.reason };
  }
  if (outcome.credited) {
    return {
      ok: true,
      credited: true,
      duplicate: outcome.duplicate,
      overpaid_crypto: outcome.overpaidCrypto,
      invoice_id: outcome.invoiceId,
    };
  }
  return { ok: true, updated: true, credited: false, status: outcome.status };
}

/**
 * Super Admin reconciliation of a single NOWPayments deposit.
 *
 * The provider status is fetched **server-side** with the server API key; nothing the browser
 * sends influences the payment data. The resulting payload is then pushed through the exact same
 * `applyNowPaymentsPayload()` path as the signed IPN — including the same credit policy, the same
 * `finalizeDepositCredit` atomic write, and the same duplicate protection.
 *
 * An admin cannot mark a deposit paid. They can only cause the provider's own answer to be
 * re-evaluated.
 */
export async function reconcileNowPaymentsDeposit(input: {
  invoiceId: string;
  adminId: string;
}): Promise<{
  ok: boolean;
  outcome:
    | "credited"
    | "already_credited"
    | "review"
    | "no_credit"
    | "not_nowpayments"
    | "no_provider_id"
    | "provider_unavailable"
    | "unknown_deposit"
    | "error";
  message: string;
  providerStatus?: string;
  invoiceId?: string;
  duplicate?: boolean;
}> {
  const invoice = await getInvoice(input.invoiceId);
  if (!invoice) {
    return { ok: false, outcome: "unknown_deposit", message: "Deposit not found." };
  }
  if (invoice.provider !== "nowpayments") {
    return {
      ok: false,
      outcome: "not_nowpayments",
      message: "This deposit is not a NOWPayments payment.",
      invoiceId: invoice.id,
    };
  }
  if (!invoice.nowPaymentId) {
    return {
      ok: false,
      outcome: "no_provider_id",
      message: "This deposit has no provider payment id. It cannot be reconciled automatically.",
      invoiceId: invoice.id,
    };
  }

  /*
   * Already credited: report success without another provider call. This is the primary
   * duplicate-credit guard; `finalizeDepositCredit` provides a second one inside the store lock.
   */
  if (invoice.walletCredited || invoice.status === "paid") {
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus: invoice.providerStatus ?? "finished",
      result: "already_credited",
      reason: "deposit_already_credited",
    });
    return {
      ok: true,
      outcome: "already_credited",
      message: "This deposit is already credited. No second credit was applied.",
      providerStatus: invoice.providerStatus ?? "finished",
      invoiceId: invoice.id,
    };
  }

  const provider = await getNowPaymentStatus(invoice.nowPaymentId);
  if (!provider.ok) {
    const status = provider.status === 404 ? "not found" : `HTTP ${provider.status}`;
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus: `unavailable:${status}`,
      result: "error",
      reason: "provider_unavailable",
    });
    return {
      ok: false,
      outcome: "provider_unavailable",
      message: `The payment provider could not be reached (${status}). Nothing was changed. Try again shortly.`,
      invoiceId: invoice.id,
    };
  }

  const data = provider.data as Record<string, unknown>;

  /*
   * Cross-check the local record against the provider's own identifiers before applying
   * anything. A mismatched provider id means we must not touch this deposit.
   */
  const providerPaymentId = data.payment_id != null ? String(data.payment_id) : "";
  if (providerPaymentId && providerPaymentId !== String(invoice.nowPaymentId)) {
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus: String(data.payment_status ?? "unknown"),
      result: "review",
      reason: "provider_payment_id_mismatch",
    });
    return {
      ok: true,
      outcome: "review",
      message: "Provider returned a different payment id. Held for manual review; nothing was credited.",
      providerStatus: String(data.payment_status ?? "unknown"),
      invoiceId: invoice.id,
    };
  }

  /*
   * Always bind the payload to this deposit's own order id, so a provider response can never be
   * applied to a different local invoice.
   */
  const payload: Record<string, unknown> = {
    ...data,
    payment_id: providerPaymentId || String(invoice.nowPaymentId),
    order_id: invoice.id,
    payment_status: data.payment_status ?? data.status ?? "",
  };

  const providerStatus = String(payload.payment_status ?? "");

  const outcome = await applyNowPaymentsPayload(invoice, payload, {
    source: "reconcile",
    audit: {
      reconciledAt: new Date().toISOString(),
      reconciledBy: input.adminId,
      reconcileProviderStatus: providerStatus,
    },
  });

  if ("error" in outcome) {
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus,
      result: "error",
      reason: outcome.error,
    });
    return { ok: false, outcome: "error", message: outcome.error, providerStatus, invoiceId: invoice.id };
  }

  if ("unknown" in outcome) {
    return { ok: false, outcome: "unknown_deposit", message: "Deposit not found.", providerStatus };
  }

  if ("review" in outcome) {
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus,
      result: "review",
      reason: outcome.reason,
    });
    return {
      ok: true,
      outcome: "review",
      message: `Held for manual review: ${outcome.reason.replace(/_/g, " ")}. Nothing was credited.`,
      providerStatus,
      invoiceId: invoice.id,
    };
  }

  if (outcome.credited) {
    await recordReconcile(invoice.id, {
      adminId: input.adminId,
      providerStatus,
      result: outcome.duplicate ? "already_credited" : "credited",
      reason: outcome.duplicate ? "duplicate_credit_prevented" : "verified_finished_payment",
    });
    return {
      ok: true,
      outcome: outcome.duplicate ? "already_credited" : "credited",
      message: outcome.duplicate
        ? "Already credited earlier. No duplicate credit was applied."
        : "Payment verified from the provider and the wallet was credited.",
      providerStatus,
      invoiceId: invoice.id,
      duplicate: outcome.duplicate,
    };
  }

  await recordReconcile(invoice.id, {
    adminId: input.adminId,
    providerStatus,
    result: "no_credit",
    reason: `provider_status_${providerStatus || "unknown"}`,
  });
  return {
    ok: true,
    outcome: "no_credit",
    message: `Provider status is "${providerStatus || "unknown"}". Only a verified finished payment can credit a wallet.`,
    providerStatus,
    invoiceId: invoice.id,
  };
}

/** Append one audit entry to the deposit's reconciliation history. */
async function recordReconcile(
  invoiceId: string,
  entry: { adminId: string; providerStatus: string; result: string; reason?: string },
) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return;
  const at = new Date().toISOString();
  const history = [...(invoice.reconcileHistory ?? []), { at, ...entry }].slice(-30);
  await updateInvoice(invoiceId, {
    reconcileHistory: history,
    reconciledAt: at,
    reconciledBy: entry.adminId,
    reconcileResult: entry.result,
    reconcileProviderStatus: entry.providerStatus,
  });
}

/**
 * Read-only invoice detail projection.
 *
 * Access is fail-closed: the caller must present EITHER the invoice owner's reseller API key
 * OR the payment access token issued at creation. Knowing the deposit id alone is never
 * sufficient, and an unauthorised probe returns the same shape as a missing invoice so ids
 * cannot be enumerated.
 */
export async function getBankerInvoiceStatus(
  invoiceId: string,
  credentials?: { apiKey?: string; accessToken?: string },
) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { error: "Invoice not found" } as const;

  const hasKey = Boolean(credentials?.apiKey);
  const hasToken = Boolean(credentials?.accessToken);
  if (!hasKey && !hasToken) return { error: "Invoice not found" } as const;

  const keyOk = hasKey && resellerKeyMatchesInvoiceKey(credentials!.apiKey!, invoice.apiKey);
  const tokenOk = hasToken && verifyDepositAccessToken(credentials!.accessToken, invoice.accessTokenHash);
  if (!keyOk && !tokenOk) return { error: "Invoice not found" } as const;

  return {
    deposit_id: invoice.id,
    invoice_id: invoice.id,
    nowpayments_payment_id: invoice.nowPaymentId ?? null,
    amount: invoice.amountUsd.toFixed(2),
    currency: "USD",
    status: invoice.status,
    provider_status: invoice.providerStatus ?? null,
    wallet_credited: Boolean(invoice.walletCredited),
    payment_url: invoice.payUrl ?? null,
    pay_address: invoice.address ?? null,
    network: invoice.network ?? null,
    created_at: invoice.createdAt,
    paid_at: invoice.paidAt ?? null,
    pay_currency: invoice.payCurrency ?? null,
    pay_amount: invoice.payAmount ?? null,
    expires_at: invoice.expiresAt ?? null,
    tx_hash: invoice.txHash ?? null,
    status_history: invoice.statusHistory ?? [],
  };
}