import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customer/user-store";
import { listAllLedger } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [ledger, users] = await Promise.all([listAllLedger(), listCustomers()]);
  const byKey = new Map(users.map((user) => [user.apiKey, user.email]));
  return NextResponse.json({
    transactions: ledger.slice(0, 200).map((row) => ({
      ...row,
      customer: byKey.get(row.accountKey) || "Unlinked",
    })),
  });
}
