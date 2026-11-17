import { NextResponse } from "next/server";
import { configuredPayCurrencies, createBankerInvoice } from "@/lib/banker/handler";
import { requireCustomer } from "@/lib/customer/guard";
import { listInvoicesForKey } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gateway = configuredPayCurrencies();
  const invoices = await listInvoicesForKey(user.apiKey);
  return NextResponse.json({
    balance: user.balance,
    currency: "USD",
    gateway,
    payments: invoices.map((invoice) => ({
      id: invoice.id,
      amountUsd: invoice.amountUsd,
      payCurrency: invoice.payCurrency ?? null,
      payAmount: invoice.payAmount ?? null,
      address: invoice.address ?? null,
      payUrl: invoice.payUrl ?? null,
      txHash: invoice.txHash ?? null,
      status: invoice.status,
      provider: invoice.provider,
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
    amountUsd: Number(body.amount),
    payCurrency: body.payCurrency,
    requireLive: true,
  });
  if ("error" in created) return NextResponse.json({ error: created.error }, { status: 422 });
  return NextResponse.json(created);
}
