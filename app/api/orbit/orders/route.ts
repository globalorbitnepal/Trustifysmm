import { NextResponse } from "next/server";
import { findService } from "@/lib/dashboard/catalog";
import { listCustomers } from "@/lib/customer/user-store";
import { listAllOrders, refundOrder } from "@/lib/smm-api/demo-store";
import { recordAdminAction } from "@/lib/orbit/audit";
import { readServiceAdminSync } from "@/lib/orbit/service-admin";
import { readCatalogFile } from "@/lib/smm-upstream/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const status = url.searchParams.get("status") || "";
  const [orders, users] = await Promise.all([listAllOrders(), listCustomers()]);
  const byKey = new Map(users.map((user) => [user.apiKey, user]));
  const costs = new Map<string, number>();
  for (const service of (await readCatalogFile()).services) costs.set(String(service.localId), service.costPer1000);
  for (const service of readServiceAdminSync().custom) {
    if (service.costPer1000 !== undefined) costs.set(String(service.id), service.costPer1000);
  }
  let rows = orders.map((order) => {
    const service = findService(order.service);
    const costRate = costs.get(String(order.service));
    const cost = costRate !== undefined ? (costRate * order.quantity) / 1000 : null;
    return {
      id: order.order,
      customer: byKey.get(order.accountKey || "")?.email || "Unlinked",
      customerId: byKey.get(order.accountKey || "")?.id || null,
      service: service?.name || `Service ${order.service}`,
      serviceId: order.service,
      platform: service?.platform || "",
      link: order.link,
      quantity: order.quantity,
      charge: order.charge,
      cost,
      margin: cost === null ? null : Math.round((order.charge - cost) * 10000) / 10000,
      status: order.status,
      channel: order.channel || "dashboard",
      remains: order.remains,
      startCount: order.start_count,
      createdAt: order.createdAt,
      upstreamOrderId: order.upstreamOrderId ?? null,
      upstreamServiceId: order.upstreamServiceId ?? service?.id ?? null,
    };
  });
  if (status) rows = rows.filter((row) => row.status === status);
  if (q) rows = rows.filter((row) => `${row.id} ${row.customer} ${row.service} ${row.link}`.toLowerCase().includes(q));
  return NextResponse.json({ orders: rows.slice(0, 200), total: rows.length });
}

export async function POST(request: Request) {
  let body: { orderId?: number; reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reason = body.reason?.trim() || "";
  if (!body.orderId || reason.length < 3) return NextResponse.json({ error: "Order and a reason are required." }, { status: 400 });
  const result = await refundOrder(body.orderId, `Orbit refund: ${reason}`);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  await recordAdminAction("order.refund", `#${body.orderId} ${reason}`);
  return NextResponse.json({ ok: true, status: result.order.status, balance: result.account.balance });
}
