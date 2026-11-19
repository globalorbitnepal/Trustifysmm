import { NextResponse } from "next/server";
import { configuredPayCurrencies, createBankerInvoice } from "@/lib/banker/handler";
import { publicGatewayConfig } from "@/lib/nowpayments/config";
import { ensureDepositReconciler } from "@/lib/nowpayments/reconciler";
import { customerDepositReason } from "@/lib/nowpayments/status";
import { requireCustomer } from "@/lib/customer/guard";
import { listInvoicesForKey } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ensureDepositReconciler();
  const gateway = { ...configuredPayCurrencies(), ...publicGatewayConfig() };
  const invoices = await listInvoicesForKey(user.apiKey);
  return NextResponse.json({
    balance: user.balance,
    currency: "USD",
    customer: { name: user.name, email: user.email },
    gateway,
    payments: invoices.map((invoice) => ({
      id: invoice.id,
      amountUsd: invoice.amountUsd,
      payCurrency: invoice.payCurrency ?? null,
    payAmount: invoice.payAmount ?? null,
    baseCrypto: invoice.baseCrypto ?? null,
    feeUsd: invoice.quotedFeeUsd ?? null,
    address: invoice.address ?? null,
      payUrl: invoice.payUrl ?? null,
      txHash: invoice.txHash ?? null,
      status: invoice.status,
      provider: invoice.provider,
      providerStatus: invoice.providerStatus ?? null,
      nowPaymentId: invoice.nowPaymentId ?? null,
      network: invoice.network ?? null,
      walletCredited: Boolean(invoice.walletCredited),
      reviewReason: invoice.reviewReason ?? null,
      statusReason: customerDepositReason({
        status: invoice.status,
        providerStatus: invoice.providerStatus,
        reviewReason: invoice.reviewReason,
      }),
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt ?? null,
      expiresAt: invoice.expiresAt ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { amount?: number; payCurrency?: string };
  try {
    body = (await request.json()) as { amount?: number; payCurrency?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const created = await createBankerInvoice({
    apiKey: user.apiKey,
    userId: user.id,
    amountUsd: Number(body.amount),
    payCurrency: body.payCurrency,
    requireLive: true,
  });
  if ("error" in created) return NextResponse.json({ error: created.error }, { status: 422 });
  return NextResponse.json(created);
}
