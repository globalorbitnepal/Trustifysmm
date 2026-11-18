import { NextResponse } from "next/server";
import { syncOpenOrders } from "@/lib/smm-upstream/orders";

export const dynamic = "force-dynamic";

/**
 * Internal refresh used by the server's cron entry. It accepts no input, returns a short
 * summary, and is refused unless the caller presents the internal token, so it cannot be
 * used by a visitor to make the site talk to the fulfilment connection.
 */
export async function POST(request: Request) {
  const expected = process.env.SESSION_SECRET?.trim() || process.env.ORBIT_PASSKEY?.trim() || "";
  const presented = request.headers.get("x-internal-token") ?? "";
  if (!expected || presented !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await syncOpenOrders();
  return NextResponse.json({ ok: true, checked: results.length, results });
}
