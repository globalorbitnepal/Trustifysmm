import { NextRequest, NextResponse } from "next/server";
import { handleNowPaymentsIpnRequest } from "@/lib/nowpayments/ipn-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-nowpayments-sig");
  const result = await handleNowPaymentsIpnRequest(raw, signature);
  return NextResponse.json(result.body, { status: result.status });
}