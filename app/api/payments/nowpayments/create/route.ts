import { NextResponse } from "next/server";
import { createBankerInvoice } from "@/lib/banker/handler";
import { requireCustomer } from "@/lib/customer/guard";
import { findDepositOption } from "@/lib/nowpayments/currencies";
import { rateLimit } from "@/lib/nowpayments/rate-limit";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`np:create:${user.id}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many deposit attempts. Try again shortly.", retry_after: limited.retryAfterSec },
      { status: 429 },
    );
  }

  let body: { amount?: number; payCurrency?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const cfg = loadNowPaymentsConfig();
  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Enter a valid USD amount." }, { status: 400 });
  }
  if (amount < cfg.minDepositUsd || amount > cfg.maxDepositUsd) {
    return NextResponse.json(
      { error: amount > cfg.maxDepositUsd ? `The highest top-up is $${cfg.maxDepositUsd.toLocaleString()}.` : "Choose $10, $20, $25, $50, or $100." },
      { status: 400 },
    );
  }
  const requested = (body.payCurrency || "").trim().toLowerCase();
  if (requested) {
    const option = await findDepositOption(requested);
    if (!option) {
      return NextResponse.json({ error: "That coin and network combination is not enabled." }, { status: 400 });
    }
  }

  const created = await createBankerInvoice({
    apiKey: user.apiKey,
    userId: user.id,
    amountUsd: amount,
    payCurrency: body.payCurrency,
    requireLive: true,
  });
  if ("error" in created) return NextResponse.json({ error: created.error }, { status: 422 });

  return NextResponse.json({
    ...created,
    limits: { min: cfg.minDepositUsd, max: cfg.maxDepositUsd },
  });
}