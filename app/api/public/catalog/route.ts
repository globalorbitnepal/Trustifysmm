import { NextResponse } from "next/server";
import { livePricingData } from "@/lib/orbit/live-catalog";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json(livePricingData());
}
