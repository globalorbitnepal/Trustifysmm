import { NextResponse } from "next/server";
import { listAllLogins, listAllTickets } from "@/lib/customer/panel-store";
import { registerWithEmail, listCustomers, persistCustomer, replaceCustomerApiKey } from "@/lib/customer/user-store";
import { adjustAccount, ensureAccountForCustomer, listAllLedger, listAllOrders, setAccountBalance, setAccountRevoked } from "@/lib/smm-api/demo-store";
import { recordAdminAction } from "@/lib/orbit/audit";

export const dynamic = "force-dynamic";

function maskKey(apiKey: string) {
  return `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`;
}

export async function GET() {
  const [users, orders, ledger, logins, tickets] = await Promise.all([
    listCustomers(),
    listAllOrders(),
    listAllLedger(),
    listAllLogins(),
    listAllTickets(),
  ]);
  const rows = [];
  for (const user of users) {
    /*
     * A customer always has a wallet. If the record is missing it is created here (balance 0),
     * so the Customer Wallets screen and the credit form can never report "Wallet not found".
     */
    const resolved = await ensureAccountForCustomer({ email: user.email, key: user.apiKey });
    const wallet = "account" in resolved ? resolved.account ?? null : null;
    const mine = orders.filter((order) => order.accountKey === user.apiKey);
    const money = ledger.filter((row) => row.accountKey === user.apiKey);
    const last = logins.find((row) => row.userId === user.id);
    rows.push({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username ?? null,
      image: user.image,
      balance: wallet?.balance ?? user.balance,
      orders: mine.length,
      spending: Math.round(mine.reduce((sum, order) => sum + (order.status === "Refunded" ? 0 : order.charge), 0) * 100) / 100,
      deposits: Math.round(money.filter((row) => row.type === "deposit").reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
      refunds: Math.round(money.filter((row) => row.type === "refund").reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
      apiKeyMasked: maskKey(user.apiKey),
      apiKeyRevoked: Boolean(user.apiKeyRevoked),
      suspended: Boolean(user.suspended),
      google: Boolean(user.googleId),
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
      lastLogin: last?.createdAt ?? null,
      tickets: tickets.filter((ticket) => ticket.userId === user.id).length,
    });
  }
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ customers: rows });
}

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const created = await registerWithEmail({
    name: body.name?.trim() || "",
    email: body.email?.trim() || "",
    password: body.password || "",
  });
  if (!created.user) return NextResponse.json({ error: created.error || "Could not create the customer." }, { status: 400 });
  await recordAdminAction("customer.create", created.user.email);
  return NextResponse.json({ id: created.user.id, email: created.user.email });
}

export async function PATCH(request: Request) {
  let body: {
    userId?: string;
    name?: string;
    balance?: number;
    reason?: string;
    reference?: string;
    revoked?: boolean;
    suspended?: boolean;
    direction?: "credit" | "debit";
    amount?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const users = await listCustomers();
  const user = users.find((row) => row.id === body.userId);
  if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  if (body.direction && body.amount !== undefined) {
    const reason = body.reason?.trim() || "";
    if (reason.length < 3) return NextResponse.json({ error: "A reason is required for every wallet change." }, { status: 400 });
    const value = Number(body.amount);
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Enter an amount greater than zero." }, { status: 400 });
    const delta = body.direction === "debit" ? -value : value;
    const result = await adjustAccount(
      user.apiKey,
      delta,
      `Orbit ${body.direction}: ${reason}`,
      body.reference?.trim() || undefined,
      user.email,
    );
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    user.balance = result.account.balance;
    user.updatedAt = new Date().toISOString();
    await persistCustomer(user);
    await recordAdminAction("wallet.adjust", `${user.email} ${body.direction} ${value} — ${reason}`);
    return NextResponse.json({ ok: true, balance: result.account.balance, createdWallet: Boolean(result.createdWallet) });
  }

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    user.name = name;
  }
  if (body.suspended !== undefined) user.suspended = body.suspended;
  user.updatedAt = new Date().toISOString();
  await persistCustomer(user);

  if (body.balance !== undefined) {
    const reason = body.reason?.trim() || "";
    if (reason.length < 3) return NextResponse.json({ error: "A reason is required for every wallet change." }, { status: 400 });
    const account = await setAccountBalance(user.apiKey, Number(body.balance), `Orbit set balance: ${reason}`, user.email);
    if (!account) return NextResponse.json({ error: "Balance must be zero or greater." }, { status: 400 });
    user.balance = account.balance;
    await persistCustomer(user);
    await recordAdminAction("wallet.set", `${user.email} balance ${account.balance} — ${reason}`);
  }

  if (body.revoked !== undefined) {
    await setAccountRevoked(user.apiKey, body.revoked);
    await replaceCustomerApiKey(user.id, user.apiKey, body.revoked);
    await recordAdminAction(body.revoked ? "customer.revoke" : "customer.restore", user.email);
  }
  if (body.suspended !== undefined) {
    await recordAdminAction(body.suspended ? "customer.suspend" : "customer.activate", user.email);
  }
  if (body.name !== undefined) await recordAdminAction("customer.rename", `${user.email} → ${user.name}`);

  return NextResponse.json({ ok: true });
}
