import { NextRequest, NextResponse } from "next/server";
import { bankerApiKeyFromRequest } from "@/lib/banker/api-key";
import { depositTokenFromRequest } from "@/lib/banker/access";
import { getBankerInvoiceStatus } from "@/lib/banker/handler";
import { rateLimit } from "@/lib/nowpayments/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public reseller status endpoint (documented in data/api-documentation.ts).
 *
 * Authorisation — one of:
 *   • `x-api-key: <reseller API key>` (or `Authorization: Bearer <key>`) for reseller clients
 *   • `x-deposit-token: <payment access token>` for a single deposit holder
 *
 * Knowing the deposit id alone is never sufficient. Secrets are only read from headers, never
 * from the query string. A missing invoice and a foreign invoice return the same 404 body so
 * deposit ids cannot be enumerated. This route is read-only.
 */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit(`banker:status:${clientIp}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many status requests. Try again shortly." }, { status: 429 });
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

  const result = await getBankerInvoiceStatus(id, { apiKey, accessToken });
  if ("error" in result) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
