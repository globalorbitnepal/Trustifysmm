import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { quoteCustomerFee } from "@/lib/nowpayments/client";
import { findDepositOption } from "@/lib/nowpayments/currencies";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";
import { rateLimit } from "@/lib/nowpayments/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Provider quotes are cached briefly. The checkout polls every 30 seconds and each refresh
 * costs two provider calls; without a cache the provider rate-limits us and the customer
 * sees a missing fee. The invoice itself is always created from a fresh provider response.
 */
const QUOTE_TTL_MS = 20_000;
const quoteCache = new Map<string, { at: number; body: Record<string, unknown> }>();

/** Live provider quote for the entered USD amount. Read-only: no invoice is created. */
export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`np:quote:${user.id}`, 60, 60_000);
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
  if (option.minUsd != null && amount + 1e-9 < option.minUsd) {
    return NextResponse.json(
      { error: `NOWPayments requires at least $${option.minUsd.toFixed(2)} for ${option.symbol}. Raise the amount and try again.`, minUsd: option.minUsd },
      { status: 422 },
    );
  }

  const cacheKey = `${option.code}:${amount}`;
  const hit = quoteCache.get(cacheKey);
  if (hit && Date.now() - hit.at < QUOTE_TTL_MS) {
    return NextResponse.json(hit.body);
  }

  const quoted = await quoteCustomerFee(amount, option.code);
  if (!quoted.gross || !quoted.fee) {
    // Serve the last good quote for this pair rather than a bare failure.
    if (hit) return NextResponse.json(hit.body);
    return NextResponse.json({ error: "The provider fee quote did not come back. Try again." }, { status: 502 });
  }

  const body = {
    currency: option.code,
    network: option.network,
    networkLabel: option.networkLabel,
    amountUsd: amount,
    estimatedCrypto: quoted.gross,
    baseCrypto: quoted.base,
    feeCrypto: String(quoted.fee.feeCrypto),
    feeUsd: quoted.fee.feeUsd,
  };
  quoteCache.set(cacheKey, { at: Date.now(), body });
  if (quoteCache.size > 400) {
    const oldest = [...quoteCache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 100);
    for (const [key] of oldest) quoteCache.delete(key);
  }
  return NextResponse.json(body);
}