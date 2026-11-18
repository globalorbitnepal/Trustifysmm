import { NextResponse } from "next/server";
import { presentOrder } from "@/lib/dashboard/present-order";
import { requireCustomer } from "@/lib/customer/guard";
import { getOrder } from "@/lib/smm-api/demo-store";
import { cancelOrderWithProvider, refillOrderWithProvider, syncOrderFromProvider } from "@/lib/smm-upstream/orders";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  let order = await getOrder(id);
  if (!order || order.accountKey !== user.apiKey) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  /*
   * Read-through provider status: the customer sees the real state when they open the order.
   * A provider cancel refunds the wallet through the same policy as the refund route.
   */
  if (order.upstreamOrderId && order.status !== "Completed" && order.status !== "Canceled" && order.status !== "Refunded") {
    await syncOrderFromProvider(order.order);
    order = await getOrder(id);
  }
  return NextResponse.json({ order: presentOrder(order!) });
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const order = await getOrder(id);
  if (!order || order.accountKey !== user.apiKey) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.action !== "refill" && body.action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }
  const result =
    body.action === "cancel"
      ? await cancelOrderWithProvider(id)
      : await refillOrderWithProvider(id);
  if ("error" in result) return NextResponse.json(result, { status: 422 });
  return NextResponse.json(result);
}
