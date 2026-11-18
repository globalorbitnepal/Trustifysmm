import { NextResponse } from "next/server";
import { configuredPayCurrencies, reconcileNowPaymentsDeposit } from "@/lib/banker/handler";
import { getUserByApiKey, getUserByEmail } from "@/lib/customer/user-store";
import { adjustAccountExact, getInvoice, listAllInvoices, listAllLedger, updateInvoice } from "@/lib/smm-api/demo-store";
import { MANUAL_ADJUSTMENT_ACTOR, planManualAdjustment } from "@/lib/nowpayments/credit-policy";
import { rateLimit } from "@/lib/nowpayments/rate-limit";
import { recordAdminAction } from "@/lib/orbit/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const invoices = await listAllInvoices();
  const deposits = [];
  for (const invoice of invoices) {
    const owner = await getUserByApiKey(invoice.apiKey);
    deposits.push({
      id: invoice.id,
      email: owner?.email ?? "Unknown account",
      name: owner?.name ?? null,
      amountUsd: invoice.amountUsd,
      payCurrency: invoice.payCurrency ?? null,
      payAmount: invoice.payAmount ?? null,
      address: invoice.address ?? null,
      txHash: invoice.txHash ?? null,
      status: invoice.status,
      provider: invoice.provider,
      providerStatus: invoice.providerStatus ?? null,
      nowPaymentId: invoice.nowPaymentId ?? null,
      network: invoice.network ?? null,
      walletCredited: Boolean(invoice.walletCredited),
      actuallyPaidAmount: invoice.actuallyPaidAmount ?? null,
      verifiedFiatUsd: invoice.verifiedFiatUsd ?? null,
      overpaidCrypto: invoice.overpaidCrypto ?? null,
      reviewReason: invoice.reviewReason ?? null,
      creditedAmountUsd: invoice.creditedAmountUsd ?? null,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt ?? null,
      reconciledAt: invoice.reconciledAt ?? null,
      reconciledBy: invoice.reconciledBy ?? null,
      reconcileResult: invoice.reconcileResult ?? null,
      reconcileProviderStatus: invoice.reconcileProviderStatus ?? null,
      reconcileHistory: invoice.reconcileHistory ?? [],
    });
  }
  const gateway = configuredPayCurrencies();
  return NextResponse.json({
    gateway: { live: gateway.live, currencies: gateway.currencies },
    deposits,
  });
}

export async function POST(request: Request) {
  let body: {
    invoiceId?: string;
    action?: "credit" | "expire" | "fail" | "adjust" | "reconcile";
    email?: string;
    amountUsd?: string;
    reason?: string;
    confirm?: boolean;
    idempotencyKey?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action === "credit") {
    return NextResponse.json(
      { error: "Manual deposit credit is disabled. NOWPayments balance changes only after a verified finished payment." },
      { status: 403 },
    );
  }

  /*
   * Super Admin reconciliation. The browser sends only a deposit id; the provider status is
   * fetched server-side with the server API key and re-evaluated through the same policy the
   * IPN uses. This action cannot force a credit.
   */
  if (body.action === "reconcile") {
    const invoiceId = (body.invoiceId || "").trim();
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    }
    const limited = rateLimit(`orbit:reconcile:${invoiceId}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Too many refreshes for this deposit. Retry in ${limited.retryAfterSec ?? 60}s.` },
        { status: 429 },
      );
    }

    const result = await reconcileNowPaymentsDeposit({
      invoiceId,
      adminId: MANUAL_ADJUSTMENT_ACTOR,
    });

    await recordAdminAction(
      "deposit.reconcile",
      JSON.stringify({
        invoiceId,
        outcome: result.outcome,
        providerStatus: result.providerStatus ?? null,
      }),
    );

    const status = result.outcome === "unknown_deposit" ? 404 : result.ok ? 200 : 502;
    return NextResponse.json(
      {
        ok: result.ok,
        outcome: result.outcome,
        message: result.message,
        providerStatus: result.providerStatus ?? null,
        duplicate: result.duplicate ?? false,
      },
      { status },
    );
  }
  if (body.action === "adjust") {
    const user = await getUserByEmail(body.email || "");
    if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    const ledger = await listAllLedger();
    const plan = planManualAdjustment({
      amountUsd: body.amountUsd || "",
      reason: body.reason,
      confirm: body.confirm,
      idempotencyKey: body.idempotencyKey,
      existingRefs: ledger.map((row) => row.ref || ""),
    });
    if ("error" in plan) return NextResponse.json({ error: plan.error }, { status: 400 });
    const result = await adjustAccountExact(user.apiKey, plan.amount, plan.description, plan.ref, {
      adminId: MANUAL_ADJUSTMENT_ACTOR,
      reason: body.reason?.trim() || "",
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ref: plan.ref, kind: "manual_adjustment" });
  }
  const invoice = await getInvoice(body.invoiceId || "");
  if (!invoice) return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  if (body.action === "expire" || body.action === "fail") {
    if (invoice.status === "paid") return NextResponse.json({ error: "A credited deposit cannot be changed." }, { status: 400 });
    await updateInvoice(invoice.id, { status: body.action === "expire" ? "expired" : "failed" });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
