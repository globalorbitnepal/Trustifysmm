import { NextRequest, NextResponse } from "next/server";
import { createBankerInvoice } from "@/lib/banker/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { key?: string; amount?: number };
  try {
    body = (await request.json()) as { key?: string; amount?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const key = body.key?.trim();
  const amount = Number(body.amount);
  if (!key) {
    return NextResponse.json({ error: "key (API key) is required" }, { status: 400 });
  }

  const result = await createBankerInvoice({ apiKey: key, amountUsd: amount });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}