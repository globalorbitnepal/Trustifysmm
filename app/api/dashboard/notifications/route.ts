import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { listNotifications, markNotificationsRead } from "@/lib/customer/panel-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ notifications: await listNotifications(user.id) });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { all?: boolean; ids?: string[] };
  try {
    body = (await request.json()) as { all?: boolean; ids?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  await markNotificationsRead(user.id, body.all ? undefined : body.ids);
  return NextResponse.json({ ok: true });
}
