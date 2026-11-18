import { NextRequest, NextResponse } from "next/server";
import { bankerApiKeyFromRequest } from "@/lib/banker/api-key";
import { depositTokenFromRequest } from "@/lib/banker/access";
import { getBankerInvoiceStatus } from "@/lib/banker/handler";
import { rateLimit } from "@/lib/nowpayments/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo invoice view — READ ONLY.
 *
 * This endpoint previously accepted `?confirm=1` to mark a demo invoice paid. A GET request
 * must never change payment or wallet state, so that capability is removed: there is no
 * longer any path from this route to `markInvoicePaid`, a status change, or a wallet credit.
 *
 * Live NOWPayments deposits and demo invoices both credit only through the signed IPN
 * webhook (`markInvoicePaid` is hard-gated to `source: "ipn"`).
 *
 * Authorisation mirrors /api/banker/status: reseller `x-api-key` header, or the single-deposit
 * `x-deposit-token` header. Secrets are never read from the query string.
 */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`banker:pay:${clientIp}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const apiKey = bankerApiKeyFromRequest(request);
  const accessToken = depositTokenFromRequest(request);
  if (!apiKey && !accessToken) {
    return NextResponse.json(
      {
        error:
          "Authentication required. Send your API key as the x-api-key header, or the deposit access token as x-deposit-token.",
      },
      { status: 401 },
    );
  }

  const invoice = await getBankerInvoiceStatus(id, { apiKey, accessToken });
  if ("error" in invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...invoice,
      read_only: true,
      message:
        "This endpoint is read-only and cannot confirm or credit a payment. Balance credits only through a verified provider webhook.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Any mutating verb is rejected outright. */
async function rejectMutation() {
  return NextResponse.json(
    { error: "This endpoint is read-only. Payments cannot be confirmed or credited here." },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export const POST = rejectMutation;
export const PUT = rejectMutation;
export const PATCH = rejectMutation;
export const DELETE = rejectMutation;
