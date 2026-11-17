import { NextResponse } from "next/server";
import { jsonWithSession } from "@/lib/customer/auth-response";
import { requireCustomer } from "@/lib/customer/guard";
import { listLogins, recordAudit } from "@/lib/customer/panel-store";
import { bumpSessionVersion, changeCustomerPassword } from "@/lib/customer/user-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    hasPassword: Boolean(user.passwordHash),
    twoFactor: "not_configured" as const,
    logins: await listLogins(user.id),
  });
}

export async function POST(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { action?: string; currentPassword?: string; nextPassword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.action === "logout-others") {
    const next = await bumpSessionVersion(user.id);
    if (!next) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    await recordAudit(user.id, "logout_other_sessions");
    next.balance = user.balance;
    return jsonWithSession(next, true);
  }
  if (body.action === "password") {
    const result = await changeCustomerPassword(user.id, body.currentPassword || "", body.nextPassword || "");
    if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: 400 });
    await recordAudit(user.id, "password_changed");
    result.user.balance = user.balance;
    return jsonWithSession(result.user, true);
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
