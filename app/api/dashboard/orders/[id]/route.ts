import { NextResponse } from "next/server";
import { presentOrder } from "@/lib/dashboard/present-order";
import { requireCustomer } from "@/lib/customer/guard";
import { getOrder } from "@/lib/smm-api/demo-store";
import { handleSmmApi } from "@/lib/smm-api/handler";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const order = await getOrder(id);
  if (!order || order.accountKey !== user.apiKey) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: presentOrder(order) });
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
  const result = await handleSmmApi({ key: user.apiKey, action: body.action, order: String(id) });
  return NextResponse.json(result, { status: result && typeof result === "object" && "error" in result ? 422 : 200 });
}
