import { NextRequest, NextResponse } from "next/server";
import { handleSmmApi } from "@/lib/smm-api/handler";
import { parseSmmApiRequest } from "@/lib/smm-api/parse-request";
import { upstreamConfigured } from "@/lib/smm-api/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function respond(request: NextRequest) {
  const params = await parseSmmApiRequest(request);
  const result = await handleSmmApi(params);
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  if (!upstreamConfigured()) {
    headers.set("X-Trustify-Api-Mode", "demo");
  }
  return NextResponse.json(result, { headers });
}

export async function POST(request: NextRequest) {
  return respond(request);
}

export async function GET(request: NextRequest) {
  return respond(request);
}