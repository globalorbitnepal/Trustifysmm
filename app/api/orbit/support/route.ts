import { NextResponse } from "next/server";
import { listAllTickets, staffReply } from "@/lib/customer/panel-store";
import { listCustomers } from "@/lib/customer/user-store";
import { recordAdminAction } from "@/lib/orbit/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tickets, users] = await Promise.all([listAllTickets(), listCustomers()]);
  const byId = new Map(users.map((user) => [user.id, user]));
  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      customer: byId.get(ticket.userId)?.email || ticket.userId,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages,
    })),
  });
}

export async function POST(request: Request) {
  let body: { ticketId?: string; body?: string; status?: "open" | "in_progress" | "waiting_customer" | "answered" | "closed" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.ticketId) return NextResponse.json({ error: "Ticket is required." }, { status: 400 });
  const saved = await staffReply(body.ticketId, body.body || "", body.status);
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
  await recordAdminAction("support.reply", body.ticketId);
  return NextResponse.json({ ok: true });
}
