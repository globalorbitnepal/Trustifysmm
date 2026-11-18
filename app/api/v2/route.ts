import { NextRequest, NextResponse } from "next/server";
import { handleSmmApi } from "@/lib/smm-api/handler";
import { parseSmmApiRequest } from "@/lib/smm-api/parse-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function respond(request: NextRequest) {
  const params = await parseSmmApiRequest(request);
  const result = await handleSmmApi(params, { ip: clientIp(request) });
  return NextResponse.json(result, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  return respond(request);
}

export async function GET(request: NextRequest) {
  return respond(request);
}