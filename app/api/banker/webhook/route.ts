import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { markInvoicePaid } from "@/lib/banker/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyNowPayments(payload: string, signature: string | null) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
  if (!secret || !signature) return false;
  const digest = createHmac("sha512", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return digest === signature;
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");

  let body: { order_id?: string; payment_status?: string; invoice_id?: string };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (process.env.NOWPAYMENTS_IPN_SECRET && !verifyNowPayments(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const invoiceId = body.order_id || body.invoice_id;
  const paid = (body.payment_status ?? "").toLowerCase() === "finished";
  if (!invoiceId || !paid) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await markInvoicePaid(invoiceId, { provider: "nowpayments" });
  return NextResponse.json(result);
}