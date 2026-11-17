import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer/guard";
import { listLedger } from "@/lib/smm-api/demo-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireCustomer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const type = url.searchParams.get("type") || "";
  let rows = await listLedger(user.apiKey);
  if (type) rows = rows.filter((row) => row.type === type);
  if (q) rows = rows.filter((row) => `${row.id} ${row.description} ${row.ref ?? ""}`.toLowerCase().includes(q));
  return NextResponse.json({
    transactions: rows.map((row) => ({
      id: row.id,
      type: row.type,
      description: row.description,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      status: row.status,
      date: row.createdAt,
    })),
  });
}
