import { NextResponse } from "next/server";
import { listAllLogins, listAllTickets } from "@/lib/customer/panel-store";
import { getUserById } from "@/lib/customer/user-store";
import { findService } from "@/lib/dashboard/catalog";
import { listApiActivity } from "@/lib/smm-api/activity";
import { getAccountByKey, listLedger, listOrdersByAccount } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  const [wallet, orders, ledger, logins, tickets, activity] = await Promise.all([
    getAccountByKey(user.apiKey),
    listOrdersByAccount(user.apiKey),
    listLedger(user.apiKey),
    listAllLogins(),
    listAllTickets(),
    listApiActivity(300),
  ]);
  return NextResponse.json({
    customer: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username ?? null,
      balance: wallet?.balance ?? user.balance,
      suspended: Boolean(user.suspended),
      apiKeyRevoked: Boolean(user.apiKeyRevoked),
      apiKeyMasked: `${user.apiKey.slice(0, 8)}…${user.apiKey.slice(-4)}`,
      google: Boolean(user.googleId),
      createdAt: user.createdAt,
    },
    orders: orders.slice(0, 40).map((order) => ({
      id: order.order,
      service: findService(order.service)?.name || `Service ${order.service}`,
      link: order.link,
      quantity: order.quantity,
      charge: order.charge,
      status: order.status,
      channel: order.channel || "dashboard",
      createdAt: order.createdAt,
    })),
    ledger: ledger.slice(0, 40),
    logins: logins.filter((row) => row.userId === user.id).slice(0, 20),
    tickets: tickets.filter((ticket) => ticket.userId === user.id),
    api: activity.filter((event) => event.userId === user.id || event.email === user.email).slice(0, 40),
  });
}
