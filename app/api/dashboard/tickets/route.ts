import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { createTicket, listTickets, type TicketCategory, type TicketPriority } from "@/lib/customer/panel-store";

export const dynamic = "force-dynamic";

const categories = new Set(["order", "payment", "service", "account", "general"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);

export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = new URL(request.url).searchParams.get("status") || "";
  const q = (new URL(request.url).searchParams.get("q") || "").toLowerCase();
  let tickets = await listTickets(user.id);
  if (status) tickets = tickets.filter((ticket) => ticket.status === status);
  if (q) tickets = tickets.filter((ticket) => `${ticket.id} ${ticket.subject}`.toLowerCase().includes(q));
  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      orderId: ticket.orderId ?? null,
      updatedAt: ticket.updatedAt,
      createdAt: ticket.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const subject = String(form.get("subject") || "").trim();
  const category = String(form.get("category") || "");
  const priority = String(form.get("priority") || "normal");
  const message = String(form.get("message") || "").trim();
  const orderId = String(form.get("orderId") || "").trim();
  if (subject.length < 4 || subject.length > 140) return NextResponse.json({ error: "Subject must be 4–140 characters." }, { status: 400 });
  if (!categories.has(category)) return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  if (!priorities.has(priority)) return NextResponse.json({ error: "Choose a priority." }, { status: 400 });
  if (message.length < 10 || message.length > 4000) return NextResponse.json({ error: "Message must be 10–4000 characters." }, { status: 400 });

  let attachment: { id: string; name: string } | undefined;
  const file = form.get("attachment");
  if (file instanceof File && file.size > 0) {
    if (file.size > 1_500_000) return NextResponse.json({ error: "Attachment must be under 1.5 MB." }, { status: 400 });
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "Attachment must be PNG, JPG, WEBP, or PDF." }, { status: 400 });
    const id = randomBytes(12).toString("hex");
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] || "bin";
    const dir = path.join(process.cwd(), "data", "runtime", "ticket-uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()));
    attachment = { id: `${id}.${ext}`, name: file.name.slice(0, 120) };
  }

  const ticket = await createTicket({
    userId: user.id,
    subject,
    category: category as TicketCategory,
    priority: priority as TicketPriority,
    orderId: orderId || undefined,
    message,
    attachment,
  });
  return NextResponse.json({ ticketId: ticket.id });
}
