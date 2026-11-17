import { NextResponse } from "next/server";
import { configuredPayCurrencies, markInvoicePaid } from "@/lib/banker/handler";
import { getUserByApiKey } from "@/lib/customer/user-store";
import { getInvoice, listAllInvoices, updateInvoice } from "@/lib/smm-api/demo-store";

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
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt ?? null,
    });
  }
  const gateway = configuredPayCurrencies();
  return NextResponse.json({
    gateway: { live: gateway.live, currencies: gateway.currencies },
    deposits,
  });
}

export async function POST(request: Request) {
  let body: { invoiceId?: string; action?: "credit" | "expire" | "fail" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const invoice = await getInvoice(body.invoiceId || "");
  if (!invoice) return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  if (body.action === "credit") {
    const result = await markInvoicePaid(invoice.id, { provider: invoice.provider });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }
  if (body.action === "expire" || body.action === "fail") {
    if (invoice.status === "paid") return NextResponse.json({ error: "A credited deposit cannot be changed." }, { status: 400 });
    await updateInvoice(invoice.id, { status: body.action === "expire" ? "expired" : "failed" });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
