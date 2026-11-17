import { NextRequest, NextResponse } from "next/server";
import { classifySource, recordTrafficHit } from "@/lib/orbit/traffic-store";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sidFrom(request: NextRequest) {
  return request.cookies.get("tsmm_sid")?.value || `s_${randomBytes(8).toString("hex")}`;
}

export async function POST(request: NextRequest) {
  let body: { path?: string; referrer?: string; utm?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const path = (body.path || "/").slice(0, 180);
  if (path.startsWith("/orbit") || path.startsWith("/api") || path.startsWith("/_next")) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const classified = classifySource(body.referrer || "", body.utm || "");
  const sid = sidFrom(request);
  await recordTrafficHit({
    t: Date.now(),
    path,
    source: classified.source,
    host: classified.host,
    sid,
  });
  const response = NextResponse.json({ ok: true });
  if (!request.cookies.get("tsmm_sid")) {
    response.cookies.set("tsmm_sid", sid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  return response;
}
