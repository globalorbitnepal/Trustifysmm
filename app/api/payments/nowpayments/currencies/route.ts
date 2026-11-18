import { NextResponse } from "next/server";
import { listDepositOptions } from "@/lib/nowpayments/currencies";
import { publicGatewayConfig } from "@/lib/nowpayments/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gateway = publicGatewayConfig();
  if (!gateway.live) {
    return NextResponse.json({ ...gateway, options: [], providerVerified: false, error: "Gateway not configured." });
  }
  const options = await listDepositOptions();
  return NextResponse.json({
    ...gateway,
    options,
    providerVerified: options.length > 0,
    error: options.length ? null : "No enabled currencies were returned by the provider.",
  });
}