import { NextResponse } from "next/server";
import { recordAdminAction } from "@/lib/orbit/audit";
import { cancelOrderWithProvider, syncOpenOrders, syncOrderFromProvider } from "@/lib/smm-upstream/orders";

export const dynamic = "force-dynamic";

/**
 * Refresh live provider status for open orders.
 * A provider that reports canceled or refunded always returns the money to the customer wallet.
 */
export async function POST(request: Request) {
  let body: { orderId?: number; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "cancel" && body.orderId) {
    const result = await cancelOrderWithProvider(Number(body.orderId));
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    await recordAdminAction("order.cancel", `#${body.orderId} cancelled and refunded`);
    return NextResponse.json({ ok: true, ...result });
  }

  if (body.orderId) {
    const result = await syncOrderFromProvider(Number(body.orderId));
    if ("error" in result) return NextResponse.json(result, { status: 502 });
    await recordAdminAction("order.sync", `#${body.orderId} ${result.status}`);
    return NextResponse.json({ ok: true, ...result });
  }

  const results = await syncOpenOrders();
  await recordAdminAction("order.sync-all", `${results.length} orders`);
  return NextResponse.json({ ok: true, results });
}
