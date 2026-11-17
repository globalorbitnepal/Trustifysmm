import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { listNotifications } from "@/lib/customer/panel-store";
import { toPublicUser } from "@/lib/customer/user-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notes = await listNotifications(user.id);
  return NextResponse.json({
    user: toPublicUser(user),
    unread: notes.filter((note) => !note.read).length,
  });
}
