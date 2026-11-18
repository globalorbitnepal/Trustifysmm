import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { recordAudit } from "@/lib/customer/panel-store";
import { replaceCustomerApiKey, toPublicUser } from "@/lib/customer/user-store";
import { recordApiActivity } from "@/lib/smm-api/activity";
import { rotateAccountKey, setAccountRevoked } from "@/lib/smm-api/demo-store";

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (body.action === "regenerate") {
    const nextKey = `tsm_${randomBytes(24).toString("hex")}`;
    const account = await rotateAccountKey(user.apiKey, nextKey);
    if (!account) return NextResponse.json({ error: "Wallet record was not found." }, { status: 404 });
    const next = await replaceCustomerApiKey(user.id, nextKey, false);
    if (!next) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    await recordAudit(user.id, "api_key_regenerated");
    await recordApiActivity({
      userId: user.id,
      email: user.email,
      action: "generate",
      ip,
      ok: true,
      detail: "Customer generated a new API key",
      orderId: null,
      keyPrefix: nextKey.slice(0, 8),
    });
    next.balance = account.balance;
    return NextResponse.json({ user: toPublicUser(next), revealed: true });
  }
  if (body.action === "revoke") {
    await setAccountRevoked(user.apiKey, true);
    const next = await replaceCustomerApiKey(user.id, user.apiKey, true);
    if (!next) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    await recordAudit(user.id, "api_key_revoked");
    await recordApiActivity({
      userId: user.id,
      email: user.email,
      action: "revoke",
      ip,
      ok: true,
      detail: "Customer revoked the API key",
      orderId: null,
      keyPrefix: user.apiKey.slice(0, 8),
    });
    next.balance = user.balance;
    return NextResponse.json({ user: toPublicUser(next) });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
