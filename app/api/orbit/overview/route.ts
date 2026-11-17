import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customer/user-store";
import { getAccountByKey, listAllInvoices, listAllLedger, listAllOrders } from "@/lib/smm-api/demo-store";
import { listAllTickets } from "@/lib/customer/panel-store";
import { livePricingData, liveSiteConfig } from "@/lib/orbit/live-catalog";
import { listProviders } from "@/lib/orbit/providers";
import { configuredPayCurrencies } from "@/lib/banker/handler";

export const dynamic = "force-dynamic";

function inRange(iso: string, from: number, to: number) {
  const time = new Date(iso).getTime();
  return time >= from && time <= to;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "30";
  const now = Date.now();
  const span =
    range === "24h" || range === "today"
      ? 24 * 60 * 60 * 1000
      : range === "1y" || range === "365"
        ? 365 * 86400000
        : (Number(range) || 30) * 86400000;
  const from = range === "custom" ? new Date(url.searchParams.get("from") || 0).getTime() : now - span;
  const to = range === "custom" ? new Date(url.searchParams.get("to") || now).getTime() + 86400000 : now;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [users, orders, ledger, tickets, invoices, providers] = await Promise.all([
    listCustomers(),
    listAllOrders(),
    listAllLedger(),
    listAllTickets(),
    listAllInvoices(),
    listProviders(),
  ]);
  const catalog = livePricingData();
  const byId = new Map(catalog.services.map((service) => [service.id, service]));
  const customerByKey = new Map(users.map((user) => [user.apiKey, user]));
  let walletLiability = 0;
  for (const user of users) {
    const wallet = await getAccountByKey(user.apiKey);
    walletLiability += wallet?.balance ?? user.balance;
  }

  const windowOrders = orders.filter((order) => inRange(order.createdAt, from, to));
  const windowUsers = users.filter((user) => inRange(user.createdAt, from, to));
  const deposits = ledger.filter((row) => row.type === "deposit");
  const revenue = orders.filter((order) => order.status !== "Refunded" && order.status !== "Canceled").reduce((sum, order) => sum + order.charge, 0);

  const buckets = new Map<string, { customers: number; orders: number; revenue: number; deposits: number }>();
  for (let cursor = new Date(from); cursor.getTime() <= to; cursor.setDate(cursor.getDate() + 1)) {
    buckets.set(cursor.toISOString().slice(0, 10), { customers: 0, orders: 0, revenue: 0, deposits: 0 });
  }
  for (const user of windowUsers) {
    const key = user.createdAt.slice(0, 10);
    const row = buckets.get(key);
    if (row) row.customers += 1;
  }
  for (const order of windowOrders) {
    const row = buckets.get(order.createdAt.slice(0, 10));
    if (!row) continue;
    row.orders += 1;
    if (order.status !== "Refunded" && order.status !== "Canceled") row.revenue += order.charge;
  }
  for (const row of deposits) {
    if (!inRange(row.createdAt, from, to)) continue;
    const bucket = buckets.get(row.createdAt.slice(0, 10));
    if (bucket) bucket.deposits += row.amount;
  }

  const statusCounts = new Map<string, number>();
  const platforms = new Map<string, number>();
  const services = new Map<string, { name: string; orders: number; revenue: number }>();
  for (const order of windowOrders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    const service = byId.get(order.service);
    const platform = service?.platform || "other";
    platforms.set(platform, (platforms.get(platform) ?? 0) + 1);
    const current = services.get(String(order.service)) ?? { name: service?.name || `Service ${order.service}`, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.charge;
    services.set(String(order.service), current);
  }

  const gateway = configuredPayCurrencies();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    savedAt: liveSiteConfig().updatedAt,
    stats: {
      customers: users.length,
      customersToday: users.filter((user) => user.createdAt >= startOfToday.toISOString()).length,
      orders: orders.length,
      ordersToday: orders.filter((order) => order.createdAt >= startOfToday.toISOString()).length,
      activeOrders: orders.filter((order) => ["Pending", "Processing", "In progress"].includes(order.status)).length,
      completedOrders: orders.filter((order) => order.status === "Completed").length,
      walletLiability: Math.round(walletLiability * 100) / 100,
      deposits: Math.round(deposits.reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      openTickets: tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length,
      customersInRange: windowUsers.length,
      ordersInRange: windowOrders.length,
    },
    series: [...buckets.entries()].map(([date, row]) => ({
      date,
      ...row,
      revenue: Math.round(row.revenue * 100) / 100,
      deposits: Math.round(row.deposits * 100) / 100,
    })),
    statuses: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
    platforms: [...platforms.entries()].map(([platform, count]) => ({ platform, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    topServices: [...services.values()].sort((a, b) => b.orders - a.orders).slice(0, 6),
    recentOrders: orders.slice(0, 6).map((order) => ({
      id: order.order,
      customer: customerByKey.get(order.accountKey || "")?.email || "Unlinked",
      service: byId.get(order.service)?.name || `Service ${order.service}`,
      charge: order.charge,
      status: order.status,
      createdAt: order.createdAt,
    })),
    recentCustomers: [...users].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })),
    recentTickets: tickets.slice(0, 5).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
    })),
    recentTransactions: ledger.slice(0, 6),
    providers,
    gateway: { live: gateway.live, currencies: gateway.currencies },
    invoices: invoices.length,
  });
}
