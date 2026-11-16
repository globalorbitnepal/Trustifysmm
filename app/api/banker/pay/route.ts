import { NextRequest, NextResponse } from "next/server";
import { getBankerInvoiceStatus, markInvoicePaid } from "@/lib/banker/handler";
import { getSiteConfigSync } from "@/lib/orbit/site-config-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo-only payment confirmation page handler.
 * In production, real crypto gateway IPN hits /api/banker/webhook.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  const confirm = url.searchParams.get("confirm") === "1";

  if (!id) {
    return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
  }

  const invoice = await getBankerInvoiceStatus(id);
  if ("error" in invoice) {
    return NextResponse.json(invoice, { status: 404 });
  }

  const demoAuto =
    process.env.BANKER_DEMO_AUTO_PAY === "1" || getSiteConfigSync().banker.demoAutoPay;
  if (confirm && demoAuto) {
    await markInvoicePaid(id);
    const updated = await getBankerInvoiceStatus(id);
    return NextResponse.json({ ...updated, demo: true, message: "Demo payment marked as paid." });
  }

  return NextResponse.json({
    ...invoice,
    demo: true,
    message:
      "Demo banker invoice. Configure NOWPAYMENTS_API_KEY for live crypto, or set BANKER_DEMO_AUTO_PAY=1 and call with ?confirm=1 to simulate credit.",
  });
}