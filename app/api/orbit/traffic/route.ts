import { NextRequest, NextResponse } from "next/server";
import { rangeToMs, readTrafficHits, summarizeTraffic } from "@/lib/orbit/traffic-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "30";
  const from = rangeToMs(range);
  const hits = await readTrafficHits(from);
  const previous = await readTrafficHits(from - (Date.now() - from));
  const current = summarizeTraffic(hits);
  const prior = summarizeTraffic(previous.filter((hit) => hit.t < from));
  const change = prior.visits ? Math.round(((current.visits - prior.visits) / prior.visits) * 1000) / 10 : 0;
  return NextResponse.json({ range, ...current, previousVisits: prior.visits, change });
}
