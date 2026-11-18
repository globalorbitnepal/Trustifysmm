import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { estimateNowPayment } from "@/lib/nowpayments/client";
import { findDepositOption } from "@/lib/nowpayments/currencies";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";
import { rateLimit } from "@/lib/nowpayments/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live provider quote for the entered USD amount. Read-only: no invoice is created. */
export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`np:quote:${user.id}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many quote requests. Try again shortly." }, { status: 429 });
  }

  const url = new URL(request.url);
  const currency = (url.searchParams.get("currency") || "").trim().toLowerCase();
  const amount = Number(url.searchParams.get("amount"));
  const cfg = loadNowPaymentsConfig();

  if (!currency) return NextResponse.json({ error: "Choose a currency first." }, { status: 400 });
  if (!Number.isFinite(amount) || amount < cfg.minDepositUsd || amount > cfg.maxDepositUsd) {
    return NextResponse.json(
      { error: `Enter a USD amount between $${cfg.minDepositUsd} and $${cfg.maxDepositUsd}.` },
      { status: 400 },
    );
  }

  const option = await findDepositOption(currency);
  if (!option) return NextResponse.json({ error: "That currency is not enabled." }, { status: 422 });

  const quote = await estimateNowPayment(amount, option.code);
  if (!quote.ok || !quote.data.estimated_amount) {
    return NextResponse.json({ error: "The provider could not quote this amount right now." }, { status: 502 });
  }

  return NextResponse.json({
    currency: option.code,
    network: option.network,
    networkLabel: option.networkLabel,
    amountUsd: amount,
    estimatedCrypto: String(quote.data.estimated_amount),
  });
}