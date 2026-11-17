import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { updateCustomerProfile, toPublicUser } from "@/lib/customer/user-store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { name?: string; username?: string; timezone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const result = await updateCustomerProfile(user.id, {
    name: body.name,
    username: body.username?.trim() ? body.username : undefined,
    timezone: body.timezone,
  });
  if (result.error || !result.user) return NextResponse.json({ error: result.error }, { status: 400 });
  result.user.balance = user.balance;
  return NextResponse.json({ user: toPublicUser(result.user) });
}
