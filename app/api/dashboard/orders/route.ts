import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { findService } from "@/lib/dashboard/catalog";
import { presentOrder } from "@/lib/dashboard/present-order";
import { placeCustomerOrders } from "@/lib/dashboard/place-order";
import { listOrdersByAccount } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const status = url.searchParams.get("status") || "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = 12;
  const scope = url.searchParams.get("scope") || "";
  let orders = await listOrdersByAccount(user.apiKey);
  if (scope === "history") {
    orders = orders.filter((order) => ["Completed", "Partial", "Canceled", "Failed"].includes(order.status));
  }
  if (status) orders = orders.filter((order) => order.status === status);
  if (from) orders = orders.filter((order) => order.createdAt.slice(0, 10) >= from);
  if (to) orders = orders.filter((order) => order.createdAt.slice(0, 10) <= to);
  if (q) {
    orders = orders.filter((order) => {
      const service = findService(order.service);
      return `${order.order} ${order.link} ${service?.name ?? ""} ${service?.platform ?? ""}`.toLowerCase().includes(q);
    });
  }
  const total = orders.length;
  const slice = orders.slice((page - 1) * pageSize, page * pageSize).map(presentOrder);
  return NextResponse.json({ orders: slice, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { rows?: { serviceId?: number; link?: string; quantity?: number }[]; idempotencyKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const rows = (body.rows ?? []).map((row) => ({
    serviceId: Number(row.serviceId),
    link: String(row.link ?? ""),
    quantity: Number(row.quantity),
  }));
  const result = await placeCustomerOrders(user, rows, body.idempotencyKey || "");
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
