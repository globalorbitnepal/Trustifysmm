import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { getTicket, reopenTicket, replyTicket } from "@/lib/customer/panel-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ticket = await getTicket(user.id, (await ctx.params).id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  const file = new URL(request.url).searchParams.get("file");
  if (file) {
    const owns = ticket.messages.some((message) => message.attachmentId === file);
    if (!owns || !/^[\da-f]+\.(png|jpeg|jpg|webp|pdf)$/.test(file)) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    const bytes = await readFile(path.join(process.cwd(), "data", "runtime", "ticket-uploads", file));
    const type = file.endsWith(".pdf") ? "application/pdf" : file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return new NextResponse(bytes, { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({ ticket });
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await ctx.params).id;
  let body: { message?: string; reopen?: boolean };
  try {
    body = (await request.json()) as { message?: string; reopen?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.reopen) {
    const result = await reopenTicket(user.id, id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json({ ticket: result.ticket });
  }
  const message = (body.message || "").trim();
  if (message.length < 2 || message.length > 4000) {
    return NextResponse.json({ error: "Reply must be 2–4000 characters." }, { status: 400 });
  }
  const result = await replyTicket(user.id, id, message);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ticket: result.ticket });
}
