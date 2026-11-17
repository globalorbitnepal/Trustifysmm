import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { findService } from "@/lib/dashboard/catalog";
import { mapPlatformCounts } from "@/lib/dashboard/platform-label";
import { listNotifications } from "@/lib/customer/panel-store";
import { listOrdersByAccount } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

function inRange(iso: string, from: number) {
  return new Date(iso).getTime() >= from;
}

export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "30";
  const days = range === "7" ? 7 : range === "90" ? 90 : 30;
  const from = Date.now() - days * 86400000;
  const orders = await listOrdersByAccount(user.apiKey);
  const scoped = orders.filter((order) => inRange(order.createdAt, from));
  const active = orders.filter((order) => ["Pending", "Processing", "In progress"].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === "Completed").length;

  const daysKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    daysKeys.push(d.toISOString().slice(0, 10));
  }
  const ordersByDay = Object.fromEntries(daysKeys.map((key) => [key, 0]));
  const spendByDay = Object.fromEntries(daysKeys.map((key) => [key, 0]));
  const statusCounts: Record<string, number> = {};
  const platforms: Record<string, number> = {};
  for (const order of scoped) {
    const key = order.createdAt.slice(0, 10);
    if (key in ordersByDay) {
      ordersByDay[key] += 1;
      spendByDay[key] = Math.round((spendByDay[key] + order.charge) * 10000) / 10000;
    }
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    const service = findService(order.service);
    const platform = service?.platform || "other";
    platforms[platform] = (platforms[platform] ?? 0) + 1;
  }

  const notes = await listNotifications(user.id);
  return NextResponse.json({
    balance: user.balance,
    currency: "USD",
    totalOrders: orders.length,
    activeOrders: active,
    completedOrders: completed,
    recent: orders.slice(0, 6).map((order) => ({
      id: order.order,
      service: findService(order.service)?.name ?? `Service ${order.service}`,
      charge: order.charge,
      status: order.status,
      createdAt: order.createdAt,
    })),
    unread: notes.filter((note) => !note.read).length,
    series: {
      orders: daysKeys.map((day) => ({ day, value: ordersByDay[day] })),
      spend: daysKeys.map((day) => ({ day, value: spendByDay[day] })),
      statuses: statusCounts,
      platforms: mapPlatformCounts(platforms),
    },
  });
}
